import React, { useState, useEffect } from "react";
import badgeIcon from "@/assets/images/badge_icon.jpg";
import {
  X,
  Zap,
  ArrowLeft,
  Building2,
  // MapPin, // Unused
  DollarSign,
  Battery,
  // Calendar, // Unused
  Sparkles,
  BarChart3,
  // Search, // Unused
  Landmark,
  Download,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileEdit,
  Plus,
} from "lucide-react";
// InteractiveConfigDashboard moved to legacy - feature disabled for V5 cleanup
// import type { QuoteResult } from "@/services/unifiedQuoteCalculator"; // Unused

import merlinImage from "../assets/images/new_profile_merlin.png";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";
import ProQuoteFinancialModal, {
  type ProQuoteFinancialData,
} from "@/components/shared/ProQuoteFinancialModal";
// ProQuoteRunningCalculator removed — replaced by inline cost summary strip
import { ProjectInfoForm } from "./ProjectInfoForm";
// checkQuotaStandalone removed — recalculations are previews, not deliveries (Feb 2026)

import { RenewablesSection } from "./ProQuote/Forms/Renewables";
import LiveFinancialSummaryStrip from "./quotes/LiveFinancialSummaryStrip";
import SystemConfigSection from "./ProQuote/Forms/SystemConfigSection";
import ApplicationUseCaseSection from "./ProQuote/Forms/ApplicationUseCaseSection";
import FinancialParametersSection from "./ProQuote/Forms/FinancialParametersSection";
import ElectricalSpecsSection from "./ProQuote/Forms/ElectricalSpecsSection";
import ConfigurationOrchestrator from "./ProQuote/Forms/ConfigurationOrchestrator";

import { useQuoteExport } from "@/hooks/useQuoteExport";
import { QuotePreviewModal } from "./ProQuote/Export/QuotePreviewModal";
import { UploadFirstView } from "./ProQuote/Views/UploadFirstView";
import { LandingView } from "./ProQuote/Views/LandingView";
// I2: Lazy-load — only loads when "Bank Model" tab is opened
const ProfessionalModelView = React.lazy(() =>
  import("./ProQuote/Views/ProfessionalModelView").then((m) => ({
    default: m.ProfessionalModelView,
  }))
);
import { useSystemCalculation } from "@/hooks/useSystemCalculation";
import { useWizardConfig } from "@/hooks/useWizardConfig";
import { useProQuoteState } from "@/hooks/useProQuoteState";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { useRenewablesState } from "@/hooks/useRenewablesState";
import { useProQuoteEffects } from "@/hooks/useProQuoteEffects";
import { useToolCardsConfig } from "@/hooks/useToolCardsConfig";
/**
 * ADVANCED QUOTE BUILDER - MERLIN EDITION
 *
 * Enhanced custom BESS configuration with Merlin's magical theme
 * Includes detailed electrical specifications for professional quotes
 *
 * PRICING: All costs use NREL ATB 2024 values via unifiedPricingService
 * - Battery: $155/kWh base (tiered by size)
 * - Solar: $0.85/W ($850/kWp)
 * - Wind: $1,200/kW
 * - Generator: $500/kW (diesel)
 * - Fuel Cell: $3,000/kW (hydrogen)
 *
 * New Features:
 * - Watts, Amps calculations
 * - Inverter specifications
 * - Switchgear requirements
 * - Microcontroller/BMS details
 * - Transformer sizing
 * - Gradient backgrounds matching site theme
 */

interface AdvancedQuoteBuilderProps {
  show: boolean;
  onClose: () => void;

  // Callbacks for other tools (handled by parent/ModalManager)
  onOpenSmartWizard?: () => void;
  onOpenFinancing?: () => void;
  onOpenMarketIntel?: () => void;
  onOpenQuoteTemplates?: () => void;
  setSkipWizardIntro?: (skip: boolean) => void;

  // Props for custom configuration form
  storageSizeMW: number;
  durationHours: number;
  systemCost: number;
  onStorageSizeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onSystemCostChange: (value: number) => void;
  onGenerateQuote?: () => void;

  // Initial view mode
  initialView?: ViewMode;
}

type ViewMode =
  | "landing"
  | "custom-config"
  | "interactive-dashboard"
  | "professional-model"
  | "upload"
  | "upload-first"; // Added upload-first for dedicated upload landing (Feb 2026)

export default function AdvancedQuoteBuilder({
  show,
  onClose,
  onOpenSmartWizard: _onOpenSmartWizard, // Part of public API, may be used by parent components
  onOpenFinancing,
  onOpenMarketIntel,
  onOpenQuoteTemplates,
  setSkipWizardIntro: _setSkipWizardIntro, // Part of public API, may be used by parent components
  storageSizeMW,
  durationHours,
  systemCost,
  onStorageSizeChange,
  onDurationChange,
  onSystemCostChange,
  onGenerateQuote,
  initialView = "landing",
}: AdvancedQuoteBuilderProps) {
  // ═══ STATE MANAGEMENT HOOKS (Phase 1G, Feb 2026) ═══
  // Extracted 60+ useState declarations into domain-organized hooks

  // View/Modal/Professional Model State
  const {
    viewMode,
    setViewMode,
    showQuotePreview,
    setShowQuotePreview,
    previewFormat,
    setPreviewFormat,
    showWelcomePopup,
    setShowWelcomePopup,
    showHowItWorks,
    setShowHowItWorks,
    showFinancialSummary,
    setShowFinancialSummary,
    projectInfo,
    setProjectInfo,
    professionalModel,
    setProfessionalModel,
    isGeneratingModel,
    setIsGeneratingModel,
    selectedISORegion,
    setSelectedISORegion,
    projectLeverage,
    setProjectLeverage,
    interestRate,
    setInterestRate,
    loanTermYears,
    solarMW,
    setSolarMW,
    windMW,
    _setWindMW,
    generatorMW,
    setGeneratorMW,
    extractedData,
    setExtractedData,
    _uploadedDocuments,
    setUploadedDocuments,
    showUploadSection,
    setShowUploadSection,
    showExtractionSuccessModal,
    setShowExtractionSuccessModal,
    pendingExtractedData,
    setPendingExtractedData,
    showDataReview,
    setShowDataReview,
  } = useProQuoteState(initialView);

  // BESS Configuration State
  const {
    projectName,
    setProjectName,
    location,
    setLocation,
    applicationType,
    setApplicationType,
    useCase,
    setUseCase,
    chemistry,
    setChemistry,
    roundTripEfficiency,
    warrantyYears,
    setWarrantyYears,
    cyclesPerYear,
    setCyclesPerYear,
    utilityRate,
    setUtilityRate,
    demandCharge,
    setDemandCharge,
    installationType,
    setInstallationType,
    gridConnection,
    setGridConnection,
    inverterEfficiency,
    setInverterEfficiency,
    systemVoltage,
    setSystemVoltage,
    dcVoltage,
    setDcVoltage,
    inverterType,
    setInverterType,
    inverterManufacturer,
    setInverterManufacturer,
    inverterRating,
    setInverterRating,
    pcsQuoteSeparately,
    setPcsQuoteSeparately,
    numberOfInvertersInput,
    setNumberOfInvertersInput,
    switchgearType,
    switchgearRating,
    bmsType,
    _bmsManufacturer,
    transformerRequired,
    transformerRating,
    transformerVoltage,
    systemWattsInput,
    setSystemWattsInput,
    systemAmpsACInput,
    setSystemAmpsACInput,
    systemAmpsDCInput,
    setSystemAmpsDCInput,
  } = useConfigurationState();

  // Renewables & Alternative Power State
  const {
    includeRenewables,
    setIncludeRenewables,
    solarPVIncluded,
    setSolarPVIncluded,
    solarCapacityKW,
    setSolarCapacityKW,
    solarPanelType,
    setSolarPanelType,
    solarPanelEfficiency,
    setSolarPanelEfficiency,
    solarInverterType,
    setSolarInverterType,
    solarInstallType,
    setSolarInstallType,
    solarRoofSpaceSqFt,
    setSolarRoofSpaceSqFt,
    solarCanopySqFt,
    setSolarCanopySqFt,
    solarGroundAcres,
    setSolarGroundAcres,
    solarPeakSunHours,
    setSolarPeakSunHours,
    solarTrackingType,
    setSolarTrackingType,
    windTurbineIncluded,
    setWindTurbineIncluded,
    windCapacityKW,
    setWindCapacityKW,
    windTurbineType,
    setWindTurbineType,
    windClassRating,
    setWindClassRating,
    windTurbineCount,
    setWindTurbineCount,
    windHubHeight,
    setWindHubHeight,
    windTerrain,
    setWindTerrain,
    fuelCellIncluded,
    setFuelCellIncluded,
    fuelCellCapacityKW,
    setFuelCellCapacityKW,
    fuelCellType,
    setFuelCellType,
    fuelType,
    setFuelType,
    generatorIncluded,
    setGeneratorIncluded,
    generatorCapacityKW,
    setGeneratorCapacityKW,
    generatorFuelTypeSelected,
    setGeneratorFuelTypeSelected,
    generatorUseCases,
    setGeneratorUseCases,
    generatorRedundancy,
    setGeneratorRedundancy,
    generatorSpaceAvailable,
    setGeneratorSpaceAvailable,
    evChargersIncluded,
    setEvChargersIncluded,
    evLevel2Count,
    setEvLevel2Count,
    evDCFCCount,
    setEvDCFCCount,
    evHPCCount,
    setEvHPCCount,
    evChargersPerStation,
    setEvChargersPerStation,
    evAdditionalPowerKW,
    setEvAdditionalPowerKW,
  } = useRenewablesState();

  // Calculated values (with user input overrides)
  const storageSizeMWh = storageSizeMW * durationHours;
  const calculatedWatts = storageSizeMW * 1000000; // Convert MW to W
  const totalWatts = systemWattsInput !== "" ? systemWattsInput : calculatedWatts;
  const totalKW = totalWatts / 1000; // Convert W to kW
  const calculatedAmpsAC = totalWatts / systemVoltage / Math.sqrt(3); // 3-phase AC
  const maxAmpsAC = systemAmpsACInput !== "" ? systemAmpsACInput : calculatedAmpsAC;
  const calculatedAmpsDC = totalWatts / dcVoltage;
  const maxAmpsDC = systemAmpsDCInput !== "" ? systemAmpsDCInput : calculatedAmpsDC;
  const numberOfInverters = numberOfInvertersInput || Math.ceil(totalKW / inverterRating);
  const _requiredTransformerKVA = totalKW * 1.25; // 25% safety factor

  // ═══ Quote Export Hook ═══
  const { exportQuote, isExporting, exportSuccess } = useQuoteExport({
    projectInfo,
    projectName,
    location,
    applicationType,
    useCase,
    storageSizeMW,
    durationHours,
    chemistry,
    roundTripEfficiency,
    systemVoltage,
    dcVoltage,
    inverterType,
    numberOfInverters,
    inverterRating,
    gridConnection,
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    fuelCellIncluded,
    fuelCellCapacityKW,
    fuelType,
    generatorIncluded,
    generatorCapacityKW,
    generatorFuelTypeSelected,
    utilityRate,
  });

  // ═══ System Calculation Hook (Phase 1F, Feb 2026) ═══
  // Extracted from inline useEffect - now uses QuoteEngine.generateQuote() SSOT
  const { financialMetrics, isCalculating } = useSystemCalculation({
    storageSizeMW,
    durationHours,
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    generatorIncluded,
    generatorCapacityKW,
    generatorFuelTypeSelected,
    fuelCellIncluded,
    fuelCellCapacityKW,
    fuelType,
    location,
    utilityRate,
    gridConnection,
    useCase,
    onSystemCostChange,
  });

  // ═══ Wizard Config Loading Hook (Phase 1F, Feb 2026) ═══
  // Extracted from inline useEffect/useCallback - manages StreamlinedWizard config
  const { hasWizardConfig, loadWizardConfig } = useWizardConfig({
    show,
    onStorageSizeChange,
    onDurationChange,
    setSolarMW,
    setIncludeRenewables,
    setSolarPVIncluded,
    setSolarCapacityKW,
    setGeneratorMW,
    setGeneratorIncluded,
    setGeneratorCapacityKW,
    setLocation,
    setUtilityRate,
    setUseCase,
    setProjectName,
  });

  // Derived values from SSOT (with fallbacks during loading)
  const localSystemCost = financialMetrics?.totalProjectCost ?? systemCost;
  const estimatedAnnualSavings = financialMetrics?.annualSavings ?? 0;
  const paybackYears = financialMetrics?.paybackYears ?? 0;

  // ═══ EFFECTS & CALLBACKS (Phase 1G Part 2, Feb 2026) ═══
  // Extracted all useEffect and useCallback logic into organized hook
  const { handleExtractionComplete, applyExtractedData } = useProQuoteEffects({
    show,
    viewMode,
    initialView,
    solarMW,
    windMW,
    generatorMW,
    setViewMode,
    setShowUploadSection,
    setIncludeRenewables,
    setSolarPVIncluded,
    setSolarCapacityKW,
    setSolarMW,
    setWindTurbineIncluded,
    setWindCapacityKW,
    setGeneratorIncluded,
    setGeneratorCapacityKW,
    setGeneratorMW,
    setPendingExtractedData,
    setExtractedData,
    setUploadedDocuments,
    setShowExtractionSuccessModal,
    setShowDataReview,
    setLocation,
    setUtilityRate,
    setDemandCharge,
    onStorageSizeChange,
    loadWizardConfig,
  });

  // ═══ TOOL CARDS CONFIGURATION (Phase 1G Part 2, Feb 2026) ═══
  // Extracted tool cards array into reusable hook
  // ─── Scroll-spy: track which config section is visible ────────────────────
  const [activeTab, setActiveTab] = useState<string>("system");
  useEffect(() => {
    if (viewMode !== "custom-config") return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to top of viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("data-section");
          if (id) setActiveTab(id);
        }
      },
      { threshold: 0.15, rootMargin: "-80px 0px -55% 0px" }
    );
    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [viewMode]);

  const tools = useToolCardsConfig({
    setViewMode,
    setShowQuotePreview,
    onClose,
    onOpenFinancing,
    onOpenQuoteTemplates,
    onOpenMarketIntel,
  });

  if (!show) return null;

  // Export handler function
  // ═══ Merlin Advisor Tip Component ═══
  const _MerlinTip = ({ tip, context }: { tip: string; context?: string }) => (
    <div
      className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 mt-3 transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(59,130,246,0.06) 100%)",
        border: "1px solid rgba(52,211,153,0.12)",
      }}
    >
      <img
        src={merlinImage}
        alt="Merlin"
        className="w-6 h-6 rounded-full shrink-0 mt-0.5"
        style={{
          border: "1.5px solid rgba(52,211,153,0.3)",
          boxShadow: "0 0 8px rgba(52,211,153,0.15)",
        }}
      />
      <div className="min-w-0">
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          <span className="font-bold text-emerald-400/80">Merlin says:</span> {tip}
        </p>
        {context && (
          <p className="text-[10px] mt-0.5 italic" style={{ color: "rgba(255,255,255,0.3)" }}>
            {context}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: "#0f1117" }}>
      <div className="min-h-screen text-gray-100">
        {/* LANDING PAGE VIEW */}
        {viewMode === "landing" && (
          <LandingView
            tools={tools}
            onClose={onClose}
            onNavigateToConfig={() => setViewMode("custom-config")}
            setShowHowItWorks={setShowHowItWorks}
            setViewMode={setViewMode}
            hasWizardConfig={hasWizardConfig}
            loadWizardConfig={loadWizardConfig}
            showUploadSection={showUploadSection}
            setShowUploadSection={setShowUploadSection}
            extractedData={extractedData}
            handleExtractionComplete={handleExtractionComplete}
            showWelcomePopup={showWelcomePopup}
            setShowWelcomePopup={setShowWelcomePopup}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            SMART UPLOAD VIEW - DEDICATED UPLOAD-FIRST LANDING (Feb 2026)
            ════════════════════════════════════════════════════════════════════════════ */}
        {viewMode === "upload-first" && (
          <UploadFirstView
            onExtractionComplete={handleExtractionComplete}
            onNavigateToConfig={() => setViewMode("custom-config")}
            onNavigateToLanding={() => setViewMode("landing")}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            CUSTOM CONFIGURATION VIEW - REDESIGNED WITH TAB NAVIGATION & LIVE FINANCIALS
            ════════════════════════════════════════════════════════════════════════════ */}
        {viewMode === "custom-config" && (
          <div className="min-h-screen relative overflow-hidden" style={{ background: "#0f1117" }}>
            {/* ═══ STICKY HEADER WITH TAB NAVIGATION ═══ */}
            <div
              className="sticky top-0 z-20 backdrop-blur-xl"
              style={{
                background: "rgba(15, 17, 23, 0.95)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Top Bar - Title & Actions */}
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode("landing")}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
                    <div>
                      <h1 className="text-xl font-bold text-white">System Configuration</h1>
                      <p className="text-xs text-slate-500">ProQuote™ • Direct Input</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/[0.06]"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">How It Works</span>
                  </button>
                  <button
                    onClick={() => setShowFinancialSummary(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-emerald-500/[0.06]"
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(16,185,129,0.35)",
                      color: "#34d399",
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Financial Summary</span>
                  </button>
                  <button
                    onClick={() => setViewMode("professional-model")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-white/[0.06] text-slate-200 rounded-lg text-sm font-medium transition-all border border-white/15"
                  >
                    <Landmark className="w-4 h-4" />
                    <span className="hidden sm:inline">Bank Model</span>
                  </button>
                  <button
                    onClick={() => setShowQuotePreview(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-emerald-500/[0.06] text-emerald-300 rounded-lg text-sm font-medium transition-all border border-emerald-500/35"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="max-w-7xl mx-auto px-4 pb-2">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "system", label: "System", icon: <Battery className="w-4 h-4" /> },
                    {
                      id: "application",
                      label: "Application",
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      id: "financial",
                      label: "Financial",
                      icon: <DollarSign className="w-4 h-4" />,
                    },
                    { id: "electrical", label: "Electrical", icon: <Zap className="w-4 h-4" /> },
                    {
                      id: "renewables",
                      label: "Add-Ons",
                      icon: <Plus className="w-4 h-4" />,
                    },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          const section = document.querySelector(`[data-section="${tab.id}"]`);
                          section?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap relative"
                        style={{
                          color: isActive ? "#60a5fa" : "rgba(255,255,255,0.45)",
                          background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                          borderBottom: isActive
                            ? "2px solid rgba(59,130,246,0.6)"
                            : "2px solid transparent",
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ═══ PROQUOTE™ HERO BADGE PANEL — above project info ═══ */}
            <div className="max-w-[1440px] mx-auto px-4 pt-5 pb-0 relative z-0">
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="group w-full flex items-center gap-5 p-5 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(96,165,250,0.04) 50%, rgba(59,130,246,0.06) 100%)",
                  border: "2px solid rgba(59,130,246,0.20)",
                  boxShadow: "0 0 0 1px rgba(59,130,246,0.05), 0 4px 24px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.40)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px rgba(59,130,246,0.1), 0 4px 32px rgba(59,130,246,0.1), 0 0 60px rgba(59,130,246,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.20)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px rgba(59,130,246,0.05), 0 4px 24px rgba(0,0,0,0.2)";
                }}
                aria-label="Learn how ProQuote works"
              >
                <div className="shrink-0 relative">
                  <div className="relative">
                    <img
                      src={badgeIcon}
                      alt="ProQuote Badge"
                      className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(59,130,246,0.9)",
                        boxShadow: "0 0 8px rgba(59,130,246,0.4)",
                      }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-xl font-bold text-blue-400 tracking-tight">
                      ProQuote™
                    </span>
                  </div>
                  <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Full engineering control — custom equipment, fuel cells, financial modeling, and
                    bank-ready exports.
                    <span className="text-blue-400/60 font-medium"> Click to learn more →</span>
                  </p>
                </div>
                <div className="shrink-0 text-blue-500/40 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            {/* ═══ PROJECT INFO FORM - Account Creation ═══ */}
            <div className="max-w-[1440px] mx-auto px-4 py-6 relative z-0">
              <ProjectInfoForm
                onComplete={(data) => {
                  setProjectInfo(data);
                  // Update existing state if needed
                  if (data.projectName) setProjectName(data.projectName);
                  if (data.projectLocation) setLocation(data.projectLocation);
                }}
                initialData={{
                  projectName: projectName || undefined,
                  projectLocation: location || undefined,
                  projectGoals: useCase || undefined,
                  userName: "",
                  email: "",
                }}
              />
            </div>

            {/* ═══ MAIN CONFIGURATION — FULL WIDTH ═══ */}
            <div className="max-w-[1440px] mx-auto px-4 py-6 relative z-0">
              <div>
                {/* FULL WIDTH: Configuration Form */}
                <div className="space-y-6 pb-32">
                  {/* ═══ INLINE COST SUMMARY STRIP (POP Edition) ═══ */}
                  <LiveFinancialSummaryStrip
                    financialMetrics={financialMetrics}
                    isCalculating={isCalculating}
                    storageSizeMW={storageSizeMW}
                    durationHours={durationHours}
                    storageSizeMWh={storageSizeMWh}
                    onReset={() => {
                      onStorageSizeChange(2);
                      onDurationChange(4);
                    }}
                  />

                  {/* ────────────────────────────────────────────────
                    SECTION: SYSTEM CONFIGURATION
                    ──────────────────────────────────────────────── */}
                  <SystemConfigSection
                    storageSizeMW={storageSizeMW}
                    durationHours={durationHours}
                    storageSizeMWh={storageSizeMWh}
                    chemistry={chemistry}
                    installationType={installationType}
                    gridConnection={gridConnection}
                    inverterEfficiency={inverterEfficiency}
                    onStorageSizeChange={onStorageSizeChange}
                    onDurationChange={onDurationChange}
                    setChemistry={setChemistry}
                    setInstallationType={setInstallationType}
                    setGridConnection={setGridConnection}
                    setInverterEfficiency={setInverterEfficiency}
                  />

                  {/* ────────────────────────────────────────────────
                    SECTION: APPLICATION & USE CASE
                    ──────────────────────────────────────────────── */}
                  <ApplicationUseCaseSection
                    applicationType={applicationType}
                    useCase={useCase}
                    projectName={projectName}
                    location={location}
                    setApplicationType={setApplicationType}
                    setUseCase={setUseCase}
                    setProjectName={setProjectName}
                    setLocation={setLocation}
                  />

                  {/* ────────────────────────────────────────────────
                    SECTION: FINANCIAL PARAMETERS
                    ──────────────────────────────────────────────── */}
                  <FinancialParametersSection
                    utilityRate={utilityRate}
                    demandCharge={demandCharge}
                    cyclesPerYear={cyclesPerYear}
                    warrantyYears={warrantyYears}
                    setUtilityRate={setUtilityRate}
                    setDemandCharge={setDemandCharge}
                    setCyclesPerYear={setCyclesPerYear}
                    setWarrantyYears={setWarrantyYears}
                    setViewMode={setViewMode}
                  />

                  {/* ────────────────────────────────────────────────
                    SECTION: ELECTRICAL SPECIFICATIONS
                    ──────────────────────────────────────────────── */}
                  <ElectricalSpecsSection
                    pcsQuoteSeparately={pcsQuoteSeparately}
                    setPcsQuoteSeparately={setPcsQuoteSeparately}
                    inverterType={inverterType}
                    setInverterType={setInverterType}
                    numberOfInvertersInput={numberOfInvertersInput}
                    setNumberOfInvertersInput={setNumberOfInvertersInput}
                    inverterRating={inverterRating}
                    setInverterRating={setInverterRating}
                    inverterManufacturer={inverterManufacturer}
                    setInverterManufacturer={setInverterManufacturer}
                    systemWattsInput={systemWattsInput}
                    setSystemWattsInput={setSystemWattsInput}
                    systemAmpsACInput={systemAmpsACInput}
                    setSystemAmpsACInput={setSystemAmpsACInput}
                    systemAmpsDCInput={systemAmpsDCInput}
                    setSystemAmpsDCInput={setSystemAmpsDCInput}
                    systemVoltage={systemVoltage}
                    setSystemVoltage={setSystemVoltage}
                    dcVoltage={dcVoltage}
                    setDcVoltage={setDcVoltage}
                    storageSizeMW={storageSizeMW}
                    totalKW={totalKW}
                    calculatedWatts={calculatedWatts}
                    calculatedAmpsAC={calculatedAmpsAC}
                    calculatedAmpsDC={calculatedAmpsDC}
                    numberOfInverters={numberOfInverters}
                    maxAmpsAC={maxAmpsAC}
                    maxAmpsDC={maxAmpsDC}
                  />

                  {/* Renewables & Alternative Power Section */}
                  <RenewablesSection
                    includeRenewables={includeRenewables}
                    setIncludeRenewables={setIncludeRenewables}
                    solarPVIncluded={solarPVIncluded}
                    setSolarPVIncluded={setSolarPVIncluded}
                    solarCapacityKW={solarCapacityKW}
                    setSolarCapacityKW={setSolarCapacityKW}
                    solarPanelType={solarPanelType}
                    setSolarPanelType={setSolarPanelType}
                    solarPanelEfficiency={solarPanelEfficiency}
                    setSolarPanelEfficiency={setSolarPanelEfficiency}
                    solarInverterType={solarInverterType}
                    setSolarInverterType={setSolarInverterType}
                    solarInstallType={solarInstallType}
                    setSolarInstallType={setSolarInstallType}
                    solarRoofSpaceSqFt={solarRoofSpaceSqFt}
                    setSolarRoofSpaceSqFt={setSolarRoofSpaceSqFt}
                    solarCanopySqFt={solarCanopySqFt}
                    setSolarCanopySqFt={setSolarCanopySqFt}
                    solarGroundAcres={solarGroundAcres}
                    setSolarGroundAcres={setSolarGroundAcres}
                    solarPeakSunHours={solarPeakSunHours}
                    setSolarPeakSunHours={setSolarPeakSunHours}
                    solarTrackingType={solarTrackingType}
                    setSolarTrackingType={setSolarTrackingType}
                    windTurbineIncluded={windTurbineIncluded}
                    setWindTurbineIncluded={setWindTurbineIncluded}
                    windCapacityKW={windCapacityKW}
                    setWindCapacityKW={setWindCapacityKW}
                    windTurbineType={windTurbineType}
                    setWindTurbineType={setWindTurbineType}
                    windClassRating={windClassRating as 1 | 2 | 3 | 4}
                    setWindClassRating={setWindClassRating}
                    windTurbineCount={windTurbineCount}
                    setWindTurbineCount={setWindTurbineCount}
                    windHubHeight={windHubHeight}
                    setWindHubHeight={setWindHubHeight}
                    windTerrain={windTerrain}
                    setWindTerrain={setWindTerrain}
                    fuelCellIncluded={fuelCellIncluded}
                    setFuelCellIncluded={setFuelCellIncluded}
                    fuelCellCapacityKW={fuelCellCapacityKW}
                    setFuelCellCapacityKW={setFuelCellCapacityKW}
                    fuelCellType={fuelCellType}
                    setFuelCellType={setFuelCellType}
                    fuelType={fuelType}
                    setFuelType={setFuelType}
                    generatorIncluded={generatorIncluded}
                    setGeneratorIncluded={setGeneratorIncluded}
                    generatorCapacityKW={generatorCapacityKW}
                    setGeneratorCapacityKW={setGeneratorCapacityKW}
                    generatorFuelTypeSelected={generatorFuelTypeSelected}
                    setGeneratorFuelTypeSelected={setGeneratorFuelTypeSelected}
                    generatorUseCases={generatorUseCases}
                    setGeneratorUseCases={setGeneratorUseCases}
                    generatorRedundancy={generatorRedundancy}
                    setGeneratorRedundancy={setGeneratorRedundancy}
                    generatorSpaceAvailable={generatorSpaceAvailable}
                    setGeneratorSpaceAvailable={setGeneratorSpaceAvailable}
                    evChargersIncluded={evChargersIncluded}
                    setEvChargersIncluded={setEvChargersIncluded}
                    evLevel2Count={evLevel2Count}
                    setEvLevel2Count={setEvLevel2Count}
                    evDCFCCount={evDCFCCount}
                    setEvDCFCCount={setEvDCFCCount}
                    evHPCCount={evHPCCount}
                    setEvHPCCount={setEvHPCCount}
                    evChargersPerStation={evChargersPerStation}
                    setEvChargersPerStation={setEvChargersPerStation}
                    evAdditionalPowerKW={evAdditionalPowerKW}
                    setEvAdditionalPowerKW={setEvAdditionalPowerKW}
                    storageSizeMW={storageSizeMW}
                    durationHours={durationHours}
                  />

                  <ConfigurationOrchestrator
                    financialMetrics={financialMetrics}
                    isCalculating={isCalculating}
                    localSystemCost={localSystemCost}
                    estimatedAnnualSavings={estimatedAnnualSavings}
                    paybackYears={paybackYears}
                    storageSizeMW={storageSizeMW}
                    storageSizeMWh={storageSizeMWh}
                    durationHours={durationHours}
                    applicationType={applicationType}
                    useCase={useCase}
                    projectName={projectName}
                    location={location}
                    chemistry={chemistry}
                    installationType={installationType}
                    gridConnection={gridConnection}
                    inverterEfficiency={inverterEfficiency}
                    roundTripEfficiency={roundTripEfficiency}
                    cyclesPerYear={cyclesPerYear}
                    utilityRate={utilityRate}
                    demandCharge={demandCharge}
                    warrantyYears={warrantyYears}
                    setShowFinancialSummary={setShowFinancialSummary}
                    setViewMode={setViewMode}
                    onGenerateQuote={onGenerateQuote}
                    onClose={onClose}
                  />
                </div>
                {/* END CONFIGURATION FORM */}
              </div>
            </div>
          </div>
        )}

        {/* Quote Preview Modal */}
        <QuotePreviewModal
          showPreview={showQuotePreview}
          onClose={() => setShowQuotePreview(false)}
          previewFormat={previewFormat}
          setPreviewFormat={setPreviewFormat}
          onExport={exportQuote}
          isExporting={isExporting}
          exportSuccess={exportSuccess}
          projectName={projectName}
          location={location}
          applicationType={applicationType}
          useCase={useCase}
          storageSizeMW={storageSizeMW}
          storageSizeMWh={storageSizeMWh}
          durationHours={durationHours}
          chemistry={chemistry}
          roundTripEfficiency={roundTripEfficiency}
          installationType={installationType}
          gridConnection={gridConnection}
          systemVoltage={systemVoltage}
          dcVoltage={dcVoltage}
          inverterType={inverterType}
          numberOfInverters={numberOfInverters}
          inverterRating={inverterRating}
          inverterEfficiency={inverterEfficiency}
          switchgearType={switchgearType}
          switchgearRating={switchgearRating}
          bmsType={bmsType}
          transformerRequired={transformerRequired}
          transformerRating={transformerRating}
          transformerVoltage={transformerVoltage}
          cyclesPerYear={cyclesPerYear}
          warrantyYears={warrantyYears}
          utilityRate={utilityRate}
          demandCharge={demandCharge}
          solarPVIncluded={solarPVIncluded}
          solarCapacityKW={solarCapacityKW}
          solarPanelType={solarPanelType}
          solarPanelEfficiency={solarPanelEfficiency}
          windTurbineIncluded={windTurbineIncluded}
          windCapacityKW={windCapacityKW}
          windTurbineType={windTurbineType}
          fuelCellIncluded={fuelCellIncluded}
          fuelCellCapacityKW={fuelCellCapacityKW}
          fuelCellType={fuelCellType}
          fuelType={fuelType}
          generatorIncluded={generatorIncluded}
          generatorCapacityKW={generatorCapacityKW}
          generatorFuelTypeSelected={generatorFuelTypeSelected}
          generatorRedundancy={generatorRedundancy}
          localSystemCost={localSystemCost}
        />

        {/* Professional Financial Model View — lazy-loaded on first Bank Model click */}
        {viewMode === "professional-model" && (
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
                <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="30 10"
                  />
                </svg>
                Loading Bank Model…
              </div>
            }
          >
            <ProfessionalModelView
              projectInfo={projectInfo}
              professionalModel={professionalModel}
              setProfessionalModel={setProfessionalModel}
              isGeneratingModel={isGeneratingModel}
              setIsGeneratingModel={setIsGeneratingModel}
              storageSizeMW={storageSizeMW}
              durationHours={durationHours}
              selectedISORegion={selectedISORegion}
              setSelectedISORegion={setSelectedISORegion}
              projectLeverage={projectLeverage}
              setProjectLeverage={setProjectLeverage}
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              loanTermYears={loanTermYears}
              location={location}
              utilityRate={utilityRate}
              demandCharge={demandCharge}
              onClose={onClose}
              onNavigateToLanding={() => setViewMode("landing")}
            />
          </React.Suspense>
        )}

        {/* ═══ PROQUOTE MODALS ═══ */}
        <ProQuoteHowItWorksModal
          isOpen={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
          onOpenProQuote={() => {
            setShowHowItWorks(false);
            setViewMode("custom-config");
          }}
        />

        <ProQuoteFinancialModal
          isOpen={showFinancialSummary}
          onClose={() => setShowFinancialSummary(false)}
          systemLabel={`${storageSizeMW.toFixed(1)} MW / ${durationHours}h BESS${solarMW > 0 ? ` + ${(solarMW * 1000).toFixed(0)} kW Solar` : ""}${generatorMW > 0 ? ` + ${(generatorMW * 1000).toFixed(0)} kW Gen` : ""}`}
          data={
            {
              totalEquipmentCost: financialMetrics?.equipmentCost,
              installationCost: financialMetrics?.installationCost,
              totalProjectCost: financialMetrics?.totalProjectCost ?? localSystemCost,
              netCost: financialMetrics?.netCost,
              itcCredit: financialMetrics?.taxCredit,
              itcRate:
                financialMetrics?.taxCredit && financialMetrics?.totalProjectCost
                  ? financialMetrics.taxCredit / financialMetrics.totalProjectCost
                  : 0.3,
              annualSavings: estimatedAnnualSavings,
              paybackYears,
              npv: financialMetrics?.npv,
              irr: financialMetrics?.irr,
              roi25Year: financialMetrics?.roi25Year,
              lcoe: financialMetrics?.levelizedCostOfStorage,
              equipmentBreakdown: financialMetrics
                ? [
                    {
                      label: "Battery Storage",
                      cost: (financialMetrics.equipmentCost ?? 0) * 0.55,
                      notes: `${storageSizeMW.toFixed(1)} MW × ${durationHours}h LFP`,
                    },
                    {
                      label: "Power Conversion (PCS)",
                      cost: (financialMetrics.equipmentCost ?? 0) * 0.18,
                      notes: `Inverters, switchgear`,
                    },
                    {
                      label: "Balance of System",
                      cost: (financialMetrics.equipmentCost ?? 0) * 0.12,
                      notes: `BMS, enclosure, cabling`,
                    },
                    {
                      label: "EMS / Controls",
                      cost: (financialMetrics.equipmentCost ?? 0) * 0.08,
                      notes: `Energy management software`,
                    },
                    {
                      label: "Transformer / Interconnect",
                      cost: (financialMetrics.equipmentCost ?? 0) * 0.07,
                      notes: `Grid connection`,
                    },
                  ]
                : undefined,
              cashFlowProjection:
                estimatedAnnualSavings > 0
                  ? Array.from({ length: 10 }, (_, i) => {
                      const yr = i + 1;
                      const annualEsc = estimatedAnnualSavings * Math.pow(1.025, i);
                      return {
                        year: yr,
                        savings: Math.round(annualEsc),
                        cumulative: Math.round(
                          Array.from(
                            { length: yr },
                            (__, j) => estimatedAnnualSavings * Math.pow(1.025, j)
                          ).reduce((a, b) => a + b, 0) -
                            (financialMetrics?.netCost ?? localSystemCost)
                        ),
                      };
                    })
                  : undefined,
              sensitivity: [
                {
                  variable: "Electricity Rate",
                  low: paybackYears * 1.25,
                  base: paybackYears,
                  high: paybackYears * 0.8,
                  unit: "yrs",
                },
                {
                  variable: "Equipment Cost",
                  low: paybackYears * 0.85,
                  base: paybackYears,
                  high: paybackYears * 1.15,
                  unit: "yrs",
                },
                {
                  variable: "Battery Degradation",
                  low: paybackYears * 0.95,
                  base: paybackYears,
                  high: paybackYears * 1.12,
                  unit: "yrs",
                },
              ],
            } satisfies ProQuoteFinancialData
          }
        />

        {/* ════════════════════════════════════════════════════════════════════════════
            SMART UPLOAD SUCCESS MODAL (Feb 2026)
            ════════════════════════════════════════════════════════════════════════════ */}
        {showExtractionSuccessModal && pendingExtractedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Smart Upload Complete!
              </h2>

              {/* Time saved badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">
                    Saved you ~12 minutes of manual entry!
                  </span>
                </div>
              </div>

              {/* Extracted Data Summary */}
              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">✨ Extracted Information:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {pendingExtractedData.location?.state && (
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white ml-2 font-medium">
                        {pendingExtractedData.location.state}
                      </span>
                    </div>
                  )}
                  {pendingExtractedData.powerRequirements?.peakDemandKW && (
                    <div>
                      <span className="text-gray-400">Peak Demand:</span>
                      <span className="text-white ml-2 font-medium">
                        {pendingExtractedData.powerRequirements.peakDemandKW.toFixed(0)} kW
                      </span>
                    </div>
                  )}
                  {pendingExtractedData.utilityInfo?.electricityRate && (
                    <div>
                      <span className="text-gray-400">Electricity Rate:</span>
                      <span className="text-white ml-2 font-medium">
                        ${pendingExtractedData.utilityInfo.electricityRate.toFixed(3)}/kWh
                      </span>
                    </div>
                  )}
                  {pendingExtractedData.utilityInfo?.demandCharge && (
                    <div>
                      <span className="text-gray-400">Demand Charge:</span>
                      <span className="text-white ml-2 font-medium">
                        ${pendingExtractedData.utilityInfo.demandCharge}/kW
                      </span>
                    </div>
                  )}
                  {pendingExtractedData.existingInfrastructure?.hasSolar && (
                    <div>
                      <span className="text-gray-400">Solar PV:</span>
                      <span className="text-white ml-2 font-medium">
                        {pendingExtractedData.existingInfrastructure.solarKW} kW
                      </span>
                    </div>
                  )}
                  {pendingExtractedData.existingInfrastructure?.hasGenerator && (
                    <div>
                      <span className="text-gray-400">Generator:</span>
                      <span className="text-white ml-2 font-medium">
                        {pendingExtractedData.existingInfrastructure.generatorKW} kW
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDataReview(true)}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileEdit className="w-5 h-5" />
                    <span>Review & Edit Data</span>
                  </div>
                </button>
                <button
                  onClick={() => applyExtractedData(pendingExtractedData)}
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-green-500 hover:border-green-400 text-green-400 hover:text-green-300 font-semibold transition-all hover:bg-green-500/10"
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Apply & Continue</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            DATA REVIEW SCREEN (Feb 2026)
            ════════════════════════════════════════════════════════════════════════════ */}
        {showDataReview && pendingExtractedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-4xl w-full shadow-2xl border border-white/10 my-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Review Extracted Data</h2>
                  <p className="text-sm text-gray-400">
                    Make any changes before applying to your quote
                  </p>
                </div>
                <button
                  onClick={() => setShowDataReview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Editable Fields */}
              <div className="space-y-6 mb-6">
                {/* Location */}
                {pendingExtractedData.location?.state && (
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={pendingExtractedData.location.state}
                      onChange={(e) =>
                        setPendingExtractedData({
                          ...pendingExtractedData,
                          location: { ...pendingExtractedData.location!, state: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                )}

                {/* Power Requirements */}
                {pendingExtractedData.powerRequirements?.peakDemandKW && (
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Peak Demand (kW)
                    </label>
                    <input
                      type="number"
                      value={pendingExtractedData.powerRequirements.peakDemandKW}
                      onChange={(e) =>
                        setPendingExtractedData({
                          ...pendingExtractedData,
                          powerRequirements: {
                            ...pendingExtractedData.powerRequirements!,
                            peakDemandKW: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                )}

                {/* Utility Info */}
                <div className="grid grid-cols-2 gap-4">
                  {pendingExtractedData.utilityInfo?.electricityRate != null && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Electricity Rate ($/kWh)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={pendingExtractedData.utilityInfo.electricityRate}
                        onChange={(e) =>
                          setPendingExtractedData({
                            ...pendingExtractedData,
                            utilityInfo: {
                              ...pendingExtractedData.utilityInfo!,
                              electricityRate: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  )}

                  {pendingExtractedData.utilityInfo?.demandCharge != null && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Demand Charge ($/kW)
                      </label>
                      <input
                        type="number"
                        value={pendingExtractedData.utilityInfo.demandCharge}
                        onChange={(e) =>
                          setPendingExtractedData({
                            ...pendingExtractedData,
                            utilityInfo: {
                              ...pendingExtractedData.utilityInfo!,
                              demandCharge: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Solar/Generator */}
                <div className="grid grid-cols-2 gap-4">
                  {pendingExtractedData.existingInfrastructure?.hasSolar && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Solar PV (kW)
                      </label>
                      <input
                        type="number"
                        value={pendingExtractedData.existingInfrastructure.solarKW || 0}
                        onChange={(e) =>
                          setPendingExtractedData({
                            ...pendingExtractedData,
                            existingInfrastructure: {
                              ...pendingExtractedData.existingInfrastructure!,
                              solarKW: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  )}

                  {pendingExtractedData.existingInfrastructure?.hasGenerator && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Generator (kW)
                      </label>
                      <input
                        type="number"
                        value={pendingExtractedData.existingInfrastructure.generatorKW || 0}
                        onChange={(e) =>
                          setPendingExtractedData({
                            ...pendingExtractedData,
                            existingInfrastructure: {
                              ...pendingExtractedData.existingInfrastructure!,
                              generatorKW: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDataReview(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium transition-all"
                >
                  Back to Summary
                </button>
                <button
                  onClick={() => applyExtractedData(pendingExtractedData)}
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-green-500 hover:border-green-400 text-green-400 hover:text-green-300 font-semibold transition-all hover:bg-green-500/10"
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Apply Changes & Continue</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
