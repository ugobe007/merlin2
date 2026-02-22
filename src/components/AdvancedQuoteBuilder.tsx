import React, { useEffect, useCallback } from "react";
import badgeIcon from "@/assets/images/badge_icon.jpg";
import {
  X,
  Zap,
  ArrowLeft,
  ArrowRight,
  Building2,
  // MapPin, // Unused
  DollarSign,
  Battery,
  // Calendar, // Unused
  Sparkles,
  Cpu,
  FileSpreadsheet,
  Sliders,
  Gauge,
  Wand2,
  PiggyBank,
  BarChart3,
  Box,
  ScrollText,
  // Search, // Unused
  Landmark,
  Download,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
// InteractiveConfigDashboard moved to legacy - feature disabled for V5 cleanup
// import type { QuoteResult } from "@/services/unifiedQuoteCalculator"; // Unused

import merlinImage from "../assets/images/new_profile_merlin.png";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";
import ProQuoteFinancialModal, {
  type ProQuoteFinancialData,
} from "@/components/shared/ProQuoteFinancialModal";
// ProQuoteRunningCalculator removed — replaced by inline cost summary strip
import { ProjectInfoForm } from "./ProjectInfoForm";
// checkQuotaStandalone removed — recalculations are previews, not deliveries (Feb 2026)

import { RenewablesSection } from "./ProQuote/Forms/Renewables";

import { useQuoteExport } from "@/hooks/useQuoteExport";
import { QuotePreviewModal } from "./ProQuote/Export/QuotePreviewModal";
import { UploadFirstView } from "./ProQuote/Views/UploadFirstView";
import { LandingView } from "./ProQuote/Views/LandingView";
import { ProfessionalModelView } from "./ProQuote/Views/ProfessionalModelView";
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

  if (!show) return null;

  // ═══ TOOL CARDS CONFIGURATION (Phase 1G Part 2, Feb 2026) ═══
  // Extracted tool cards array into reusable hook
  const tools = useToolCardsConfig({
    setViewMode,
    setShowQuotePreview,
    onClose,
    onOpenFinancing,
    onOpenQuoteTemplates,
    onOpenMarketIntel,
  });

  // Export handler function
  // ═══ Merlin Advisor Tip Component ═══
  const MerlinTip = ({ tip, context }: { tip: string; context?: string }) => (
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
                      <p className="text-xs text-slate-500">Pro Mode • Direct Input</p>
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
                      label: "Renewables",
                      icon: <Sparkles className="w-4 h-4" />,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const section = document.querySelector(`[data-section="${tab.id}"]`);
                        section?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all whitespace-nowrap"
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
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
                <div className="space-y-6">
                  {/* ═══ PROQUOTE™ HERO BADGE PANEL ═══ */}
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
                    {/* Blue Shield Badge */}
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

                    {/* Badge Text */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-xl font-bold text-blue-400 tracking-tight">
                          ProQuote™
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Pro Mode
                        </span>
                      </div>
                      <p
                        className="text-sm leading-snug"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        Full engineering control — custom equipment, fuel cells, financial modeling,
                        and bank-ready exports.
                        <span className="text-blue-400/60 font-medium"> Click to learn more →</span>
                      </p>
                    </div>

                    {/* Arrow */}
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

                  {/* ═══ INLINE COST SUMMARY STRIP (POP Edition) ═══ */}
                  <div className="sticky top-[64px] z-20 -mx-4 px-4">
                    <div
                      className="rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-500"
                      style={{
                        background: financialMetrics
                          ? "rgba(15,17,23,0.95)"
                          : "rgba(15,17,23,0.85)",
                        border: financialMetrics
                          ? "1px solid rgba(52,211,153,0.25)"
                          : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: financialMetrics
                          ? "0 0 0 1px rgba(52,211,153,0.1), 0 4px 32px rgba(0,0,0,0.5), 0 0 60px rgba(52,211,153,0.06)"
                          : "0 4px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Top accent gradient bar */}
                      <div
                        className="h-[2px] w-full"
                        style={{
                          background: financialMetrics
                            ? "linear-gradient(90deg, #34d399 0%, #38bdf8 25%, #6ee7b7 50%, #38bdf8 75%, #34d399 100%)"
                            : "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 100%)",
                        }}
                      />

                      <div className="px-5 py-3">
                        {/* Metrics row */}
                        {financialMetrics ? (
                          <div className="flex items-center justify-center gap-3 lg:gap-5 overflow-x-auto scrollbar-none">
                            {/* System badge - left */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${isCalculating ? "bg-blue-400 animate-pulse" : "bg-emerald-400"}`}
                                style={{
                                  boxShadow: isCalculating
                                    ? "0 0 8px rgba(59,130,246,0.5)"
                                    : "0 0 8px rgba(52,211,153,0.5)",
                                }}
                              />
                              <span
                                className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline"
                                style={{ color: "rgba(52,211,153,0.7)" }}
                              >
                                {isCalculating ? "Updating" : "Live"}
                              </span>
                            </div>

                            {/* Divider */}
                            <div
                              className="w-px h-8 shrink-0"
                              style={{ background: "rgba(255,255,255,0.08)" }}
                            />

                            {/* Total Cost */}
                            <div className="flex flex-col items-center shrink-0 px-2">
                              <span
                                className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                Total
                              </span>
                              <span className="text-lg font-extrabold tabular-nums text-white leading-tight">
                                {Math.abs(financialMetrics.totalProjectCost ?? 0) >= 1_000_000
                                  ? `$${((financialMetrics.totalProjectCost ?? 0) / 1_000_000).toFixed(2)}M`
                                  : `$${((financialMetrics.totalProjectCost ?? 0) / 1_000).toFixed(0)}K`}
                              </span>
                            </div>

                            {/* After ITC */}
                            {(financialMetrics.netCost ?? 0) > 0 &&
                              (financialMetrics.netCost ?? 0) !==
                                (financialMetrics.totalProjectCost ?? 0) && (
                                <>
                                  <div
                                    className="w-px h-8 shrink-0"
                                    style={{ background: "rgba(255,255,255,0.06)" }}
                                  />
                                  <div className="flex flex-col items-center shrink-0 px-2">
                                    <span
                                      className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                      style={{ color: "rgba(255,255,255,0.35)" }}
                                    >
                                      After ITC
                                    </span>
                                    <span
                                      className="text-lg font-extrabold tabular-nums leading-tight"
                                      style={{ color: "#34d399" }}
                                    >
                                      {Math.abs(financialMetrics.netCost ?? 0) >= 1_000_000
                                        ? `$${((financialMetrics.netCost ?? 0) / 1_000_000).toFixed(2)}M`
                                        : `$${((financialMetrics.netCost ?? 0) / 1_000).toFixed(0)}K`}
                                    </span>
                                  </div>
                                </>
                              )}

                            {/* $/kWh */}
                            <div
                              className="w-px h-8 shrink-0"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                            <div className="flex flex-col items-center shrink-0 px-2">
                              <span
                                className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                $/kWh
                              </span>
                              <span
                                className="text-lg font-extrabold tabular-nums leading-tight"
                                style={{ color: "#38bdf8" }}
                              >
                                {storageSizeMWh > 0
                                  ? `$${((financialMetrics.totalProjectCost ?? 0) / (storageSizeMWh * 1000)).toFixed(0)}`
                                  : "—"}
                              </span>
                            </div>

                            {/* Payback */}
                            <div
                              className="w-px h-8 shrink-0"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                            <div className="flex flex-col items-center shrink-0 px-2">
                              <span
                                className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                Payback
                              </span>
                              <span
                                className="text-lg font-extrabold tabular-nums leading-tight"
                                style={{ color: "#34d399" }}
                              >
                                {financialMetrics.paybackYears != null
                                  ? `${financialMetrics.paybackYears.toFixed(1)} yr`
                                  : "—"}
                              </span>
                            </div>

                            {/* Annual Savings */}
                            <div
                              className="w-px h-8 shrink-0"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                            <div className="flex flex-col items-center shrink-0 px-2">
                              <span
                                className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                Savings
                              </span>
                              <span
                                className="text-lg font-extrabold tabular-nums leading-tight"
                                style={{ color: "#a78bfa" }}
                              >
                                {(financialMetrics.annualSavings ?? 0) > 0
                                  ? (financialMetrics.annualSavings ?? 0) >= 1_000_000
                                    ? `$${((financialMetrics.annualSavings ?? 0) / 1_000_000).toFixed(2)}M/yr`
                                    : `$${((financialMetrics.annualSavings ?? 0) / 1_000).toFixed(0)}K/yr`
                                  : "—"}
                              </span>
                            </div>

                            {/* ROI */}
                            {financialMetrics.roi10Year != null && (
                              <>
                                <div
                                  className="w-px h-8 shrink-0 hidden lg:block"
                                  style={{ background: "rgba(255,255,255,0.06)" }}
                                />
                                <div className="flex flex-col items-center shrink-0 px-2 hidden lg:flex">
                                  <span
                                    className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                    style={{ color: "rgba(255,255,255,0.35)" }}
                                  >
                                    10yr ROI
                                  </span>
                                  <span
                                    className="text-lg font-extrabold tabular-nums leading-tight"
                                    style={{ color: "#34d399" }}
                                  >
                                    {financialMetrics.roi10Year.toFixed(0)}%
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Divider */}
                            <div
                              className="w-px h-8 shrink-0"
                              style={{ background: "rgba(255,255,255,0.08)" }}
                            />

                            {/* System badge - right */}
                            <div className="flex items-center shrink-0">
                              <span
                                className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide"
                                style={{
                                  background: "rgba(52,211,153,0.08)",
                                  color: "rgba(52,211,153,0.6)",
                                  border: "1px solid rgba(52,211,153,0.15)",
                                }}
                              >
                                {storageSizeMW > 0 ? `${storageSizeMW.toFixed(1)} MW` : "—"} /{" "}
                                {durationHours > 0 ? `${durationHours}h` : "—"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3 py-1">
                            <div className="w-2 h-2 rounded-full bg-white/15" />
                            <span
                              className="text-xs font-medium"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Set your BESS power and duration to see real-time pricing
                            </span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{
                                background: "rgba(255,255,255,0.04)",
                                color: "rgba(255,255,255,0.25)",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {storageSizeMW > 0 ? `${storageSizeMW.toFixed(1)} MW` : "—"} /{" "}
                              {durationHours > 0 ? `${durationHours}h` : "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────
                    SECTION: SYSTEM CONFIGURATION
                    ──────────────────────────────────────────────── */}
                  <div
                    data-section="system"
                    className="scroll-mt-48 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Section Header */}
                    <div
                      className="px-6 py-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(59,130,246,0.1)" }}
                        >
                          <Battery className="w-5 h-5 text-blue-400" />
                        </div>
                        System Configuration
                        <span
                          className="text-xs font-normal ml-auto"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          Core BESS Parameters
                        </span>
                      </h3>
                      <MerlinTip
                        tip={
                          storageSizeMW < 0.5
                            ? "Start with your peak demand. Most commercial sites need 500 kW – 2 MW of BESS power with 2-4 hour duration."
                            : `${(storageSizeMW * 1000).toFixed(0)} kW / ${durationHours}h = ${storageSizeMWh.toFixed(1)} MWh is a solid configuration. Adjust duration for more energy shifting or backup runtime.`
                        }
                        context="Based on NREL ATB 2024 commercial BESS sizing benchmarks"
                      />
                    </div>

                    {/* Section Content */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Power Capacity - Full Width Slider */}
                        <div
                          className="lg:col-span-2 rounded-xl p-5"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label
                              className="text-sm font-semibold"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Power Capacity
                            </label>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-md"
                              style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
                            >
                              {(storageSizeMW * 1000).toFixed(0)} kW
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={storageSizeMW}
                              onChange={(e) => onStorageSizeChange(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 ${((storageSizeMW - 0.1) / 9.9) * 100}%, rgba(255,255,255,0.08) ${((storageSizeMW - 0.1) / 9.9) * 100}%)`,
                              }}
                            />
                            <div className="relative">
                              <input
                                type="number"
                                value={storageSizeMW}
                                onChange={(e) =>
                                  onStorageSizeChange(parseFloat(e.target.value) || 0.1)
                                }
                                step="0.1"
                                min="0.1"
                                max="50"
                                className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                }}
                              />
                              <span
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                MW
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Duration - Full Width Slider */}
                        <div
                          className="lg:col-span-2 rounded-xl p-5"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <label
                              className="text-sm font-semibold"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Duration
                            </label>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-md"
                              style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                            >
                              {(storageSizeMW * durationHours).toFixed(1)} MWh total
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.5"
                              max="12"
                              step="0.5"
                              value={durationHours}
                              onChange={(e) => onDurationChange(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                              style={{
                                background: `linear-gradient(to right, #6366f1 ${((durationHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) ${((durationHours - 0.5) / 11.5) * 100}%)`,
                              }}
                            />
                            <div className="relative">
                              <input
                                type="number"
                                value={durationHours}
                                onChange={(e) =>
                                  onDurationChange(parseFloat(e.target.value) || 0.5)
                                }
                                step="0.5"
                                min="0.5"
                                max="24"
                                className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                }}
                              />
                              <span
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                hrs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Battery Chemistry */}
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Battery Chemistry
                          </label>
                          <select
                            value={chemistry}
                            onChange={(e) => setChemistry(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="lfp">LiFePO4 (LFP) - Long life, safe</option>
                            <option value="nmc">NMC - High energy density</option>
                            <option value="lto">LTO - Ultra-long life</option>
                            <option value="sodium-ion">Sodium-Ion - Low cost</option>
                          </select>
                        </div>

                        {/* Installation Type */}
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Installation Type
                          </label>
                          <select
                            value={installationType}
                            onChange={(e) => setInstallationType(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="outdoor">Outdoor (Containerized)</option>
                            <option value="indoor">Indoor (Room/Vault)</option>
                            <option value="rooftop">Rooftop</option>
                          </select>
                        </div>

                        {/* Grid Connection */}
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Grid Connection
                          </label>
                          <select
                            value={gridConnection}
                            onChange={(e) => setGridConnection(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="ac-coupled">AC-Coupled (Grid-tied)</option>
                            <option value="dc-coupled">DC-Coupled (with Solar)</option>
                            <option value="hybrid">Hybrid (AC+DC)</option>
                            <option value="off-grid">Off-Grid/Island Mode</option>
                          </select>
                        </div>

                        {/* Inverter Efficiency */}
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Inverter Efficiency (%)
                          </label>
                          <input
                            type="number"
                            value={inverterEfficiency}
                            onChange={(e) =>
                              setInverterEfficiency(parseFloat(e.target.value) || 90)
                            }
                            min="85"
                            max="99"
                            step="0.5"
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────
                    SECTION: APPLICATION & USE CASE
                    ──────────────────────────────────────────────── */}
                  <div
                    data-section="application"
                    className="scroll-mt-48 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="px-6 py-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(34,197,94,0.1)" }}
                        >
                          <Building2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        Application & Use Case
                        <span
                          className="text-xs font-normal ml-auto"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          How you'll use the system
                        </span>
                      </h3>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Application Type
                          </label>
                          <select
                            value={applicationType}
                            onChange={(e) => setApplicationType(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial & Industrial</option>
                            <option value="utility">Utility Scale</option>
                            <option value="microgrid">Microgrid</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Primary Use Case
                          </label>
                          <select
                            value={useCase}
                            onChange={(e) => setUseCase(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value="peak-shaving">Peak Shaving / Demand Reduction</option>
                            <option value="arbitrage">Energy Arbitrage / TOU</option>
                            <option value="backup">Backup Power / UPS</option>
                            <option value="solar-shifting">Solar + Storage</option>
                            <option value="frequency-regulation">Frequency Regulation</option>
                            <option value="renewable-smoothing">Renewable Smoothing</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Project Name
                          </label>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., Downtown Hotel BESS"
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            Location
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="City, State"
                            className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────
                    SECTION: FINANCIAL PARAMETERS
                    ──────────────────────────────────────────────── */}
                  <div
                    data-section="financial"
                    className="scroll-mt-48 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="px-6 py-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(16,185,129,0.1)" }}
                        >
                          <DollarSign className="w-5 h-5" style={{ color: "#34d399" }} />
                        </div>
                        Financial Parameters
                        <span
                          className="text-xs font-normal ml-auto"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          Rates & costs for ROI calculation
                        </span>
                      </h3>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label
                            className="block text-xs font-bold uppercase tracking-wider mb-2"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Utility Rate
                          </label>
                          <div className="relative">
                            <span
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                              style={{ color: "rgba(16,185,129,0.6)" }}
                            >
                              $
                            </span>
                            <input
                              type="number"
                              value={utilityRate}
                              onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                              step="0.01"
                              className="w-full pl-7 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                              }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              /kWh
                            </span>
                          </div>
                        </div>

                        <div>
                          <label
                            className="block text-xs font-bold uppercase tracking-wider mb-2"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Demand Charge
                          </label>
                          <div className="relative">
                            <span
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                              style={{ color: "rgba(16,185,129,0.6)" }}
                            >
                              $
                            </span>
                            <input
                              type="number"
                              value={demandCharge}
                              onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                              }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              /kW
                            </span>
                          </div>
                        </div>

                        <div>
                          <label
                            className="block text-xs font-bold uppercase tracking-wider mb-2"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Cycles / Year
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={cyclesPerYear}
                              onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                              className="w-full px-3 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                              }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              cyc/yr
                            </span>
                          </div>
                        </div>

                        <div>
                          <label
                            className="block text-xs font-bold uppercase tracking-wider mb-2"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            Warranty
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={warrantyYears}
                              onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 10)}
                              className="w-full px-3 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                              }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              years
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Financials Link */}
                      <div
                        className="mt-6 p-4 rounded-xl"
                        style={{
                          background: "rgba(16,185,129,0.05)",
                          border: "1px solid rgba(16,185,129,0.15)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5" style={{ color: "#34d399" }} />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                Need Bank-Ready Financials?
                              </p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                3-Statement Model, DSCR, IRR, MACRS, Revenue Stacking
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewMode("professional-model")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              background: "rgba(16,185,129,0.1)",
                              color: "#34d399",
                              border: "1px solid rgba(16,185,129,0.2)",
                            }}
                          >
                            Open Pro Model
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────
                    SECTION: ELECTRICAL SPECIFICATIONS
                    ──────────────────────────────────────────────── */}
                  <div
                    data-section="electrical"
                    className="scroll-mt-48 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="px-6 py-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(16,185,129,0.1)" }}
                        >
                          <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        Electrical Specifications
                        <span
                          className="text-xs font-normal ml-auto"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          PCS, Inverters, Transformers
                        </span>
                      </h3>
                      <MerlinTip
                        tip="Most projects use a pre-engineered containerized BESS solution that includes the PCS, BMS, and thermal management. Transformer specs should match your utility interconnection requirements."
                        context="IEEE 1547-2018 interconnection standard"
                      />
                    </div>

                    <div className="p-6">
                      {/* Power Conversion System (PCS) Configuration */}
                      <div
                        className="rounded-xl p-6 mb-6"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <h4 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-400" />
                          Power Conversion System (PCS)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* PCS Quoting Option */}
                          <div className="col-span-full">
                            <label
                              className="block text-sm font-semibold mb-3"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              PCS Quoting Method
                            </label>
                            <div className="flex gap-4">
                              <label
                                className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1"
                                style={{
                                  background: !pcsQuoteSeparately
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(255,255,255,0.03)",
                                  border: !pcsQuoteSeparately
                                    ? "1px solid rgba(16,185,129,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <input
                                  type="radio"
                                  checked={!pcsQuoteSeparately}
                                  onChange={() => setPcsQuoteSeparately(false)}
                                  className="w-5 h-5 text-emerald-500"
                                />
                                <span className="text-sm font-semibold text-white">
                                  Included with BESS System
                                </span>
                              </label>
                              <label
                                className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1"
                                style={{
                                  background: pcsQuoteSeparately
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(255,255,255,0.03)",
                                  border: pcsQuoteSeparately
                                    ? "1px solid rgba(16,185,129,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <input
                                  type="radio"
                                  checked={pcsQuoteSeparately}
                                  onChange={() => setPcsQuoteSeparately(true)}
                                  className="w-5 h-5 text-emerald-500"
                                />
                                <span className="text-sm font-semibold text-white">
                                  Quote PCS Separately
                                </span>
                              </label>
                            </div>
                            {pcsQuoteSeparately && (
                              <p
                                className="text-sm mt-3 rounded-lg p-3"
                                style={{
                                  color: "rgba(16,185,129,0.9)",
                                  background: "rgba(16,185,129,0.08)",
                                  border: "1px solid rgba(16,185,129,0.15)",
                                }}
                              >
                                💡 PCS will be itemized separately in the quote with detailed
                                specifications
                              </p>
                            )}
                          </div>

                          {/* Inverter Type */}
                          <div>
                            <label
                              className="block text-sm font-semibold mb-3"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Inverter Type
                            </label>
                            <select
                              value={inverterType}
                              onChange={(e) => setInverterType(e.target.value)}
                              className="w-full px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              <option value="bidirectional">Bidirectional Inverter</option>
                              <option value="unidirectional">Unidirectional (Charge Only)</option>
                            </select>
                            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {inverterType === "bidirectional"
                                ? "⚡ Supports charge & discharge"
                                : "⚡ Charge only (typical for solar)"}
                            </p>
                          </div>

                          {/* Number of Inverters */}
                          <div>
                            <label
                              className="block text-sm font-semibold mb-3"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Number of Inverters
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={numberOfInvertersInput}
                                onChange={(e) =>
                                  setNumberOfInvertersInput(parseInt(e.target.value) || 1)
                                }
                                min="1"
                                className="flex-1 px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}
                                placeholder="Auto-calculated"
                              />
                              <button
                                onClick={() =>
                                  setNumberOfInvertersInput(Math.ceil(totalKW / inverterRating))
                                }
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-700 rounded-lg text-sm font-bold text-white transition-all shadow-sm"
                                title="Auto-calculate based on system size"
                              >
                                Auto
                              </button>
                            </div>
                            <p
                              className="text-sm mt-2 font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              Suggested: {Math.ceil(totalKW / inverterRating)} units @{" "}
                              {inverterRating} kW each
                            </p>
                          </div>

                          {/* Inverter Rating */}
                          <div>
                            <label
                              className="block text-sm font-semibold mb-2"
                              style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                              Inverter Rating (kW per unit)
                            </label>
                            <input
                              type="number"
                              value={inverterRating}
                              onChange={(e) =>
                                setInverterRating(parseFloat(e.target.value) || 2500)
                              }
                              step="100"
                              min="100"
                              className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                          </div>

                          {/* Manufacturer */}
                          <div>
                            <label
                              className="block text-sm font-semibold mb-2"
                              style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                              Inverter Manufacturer (Optional)
                            </label>
                            <input
                              type="text"
                              value={inverterManufacturer}
                              onChange={(e) => setInverterManufacturer(e.target.value)}
                              placeholder="e.g., SMA, Sungrow, Power Electronics"
                              className="w-full px-4 py-3 rounded-lg text-white text-base placeholder-white/30 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Electrical Parameters - INPUT FIELDS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* System Watts */}
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          <label
                            className="block text-xs mb-2 font-semibold"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            System Power (Watts)
                          </label>
                          <input
                            type="number"
                            value={systemWattsInput}
                            onChange={(e) =>
                              setSystemWattsInput(
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            placeholder={calculatedWatts.toLocaleString()}
                            className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                          <p className="text-xs text-emerald-400 mt-2 font-bold">
                            {totalKW.toLocaleString()} kW / {(totalKW / 1000).toFixed(2)} MW
                          </p>
                          <p
                            className="text-xs mt-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Calculated: {calculatedWatts.toLocaleString()} W
                          </p>
                        </div>

                        {/* AC Amps */}
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.2)",
                          }}
                        >
                          <label
                            className="block text-xs mb-2 font-semibold"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            AC Current (3-Phase)
                          </label>
                          <input
                            type="number"
                            value={systemAmpsACInput}
                            onChange={(e) =>
                              setSystemAmpsACInput(
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            placeholder={calculatedAmpsAC.toFixed(0)}
                            className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                          <p className="text-xs text-indigo-400 mt-2 font-bold">
                            @ {systemVoltage}V AC Per Phase
                          </p>
                          <p
                            className="text-xs mt-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Calculated: {calculatedAmpsAC.toFixed(0)} A
                          </p>
                        </div>

                        {/* DC Amps */}
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          <label
                            className="block text-xs mb-2 font-semibold"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            DC Current (Battery Side)
                          </label>
                          <input
                            type="number"
                            value={systemAmpsDCInput}
                            onChange={(e) =>
                              setSystemAmpsDCInput(
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            placeholder={calculatedAmpsDC.toFixed(0)}
                            className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                          <p className="text-xs text-blue-400 mt-2 font-bold">@ {dcVoltage}V DC</p>
                          <p
                            className="text-xs mt-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Calculated: {calculatedAmpsDC.toFixed(0)} A
                          </p>
                        </div>
                      </div>

                      {/* Voltage Configuration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div
                          className="rounded-lg p-4"
                          style={{
                            background: "rgba(99,102,241,0.06)",
                            border: "1px solid rgba(99,102,241,0.15)",
                          }}
                        >
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            AC System Voltage (V)
                          </label>
                          <select
                            value={systemVoltage}
                            onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <option value={208}>208V (Small Commercial)</option>
                            <option value={480}>480V (Standard Industrial)</option>
                            <option value={600}>600V (Large Industrial)</option>
                            <option value={4160}>4.16 kV (Medium Voltage)</option>
                            <option value={13800}>13.8 kV (Utility Scale)</option>
                          </select>
                        </div>

                        <div
                          className="rounded-lg p-4"
                          style={{
                            background: "rgba(59,130,246,0.06)",
                            border: "1px solid rgba(59,130,246,0.15)",
                          }}
                        >
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            DC Battery Voltage (V)
                          </label>
                          <input
                            type="number"
                            value={dcVoltage}
                            onChange={(e) => setDcVoltage(parseInt(e.target.value) || 1000)}
                            step="100"
                            min="100"
                            className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                          <p
                            className="text-xs mt-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            Typical: 800V - 1500V DC
                          </p>
                        </div>
                      </div>

                      {/* Summary Card */}
                      <div
                        className="rounded-xl p-6"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-emerald-400" />
                          System Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p
                              className="mb-1 font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              Total Power:
                            </p>
                            <p className="text-xl font-bold text-white">
                              {(totalKW / 1000).toFixed(2)} MW
                            </p>
                          </div>
                          <div>
                            <p
                              className="mb-1 font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              Inverters:
                            </p>
                            <p className="text-xl font-bold text-white">
                              {numberOfInverters} units
                            </p>
                          </div>
                          <div>
                            <p
                              className="mb-1 font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              AC Current:
                            </p>
                            <p className="text-xl font-bold text-indigo-400">
                              {maxAmpsAC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
                            </p>
                          </div>
                          <div>
                            <p
                              className="mb-1 font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              DC Current:
                            </p>
                            <p className="text-xl font-bold text-blue-400">
                              {maxAmpsDC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
                            </p>
                          </div>
                        </div>
                        <div
                          className="mt-4 pt-4"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className="text-sm font-medium"
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              PCS Configuration:
                            </span>
                            <span className="text-sm font-bold text-white">
                              {inverterType === "bidirectional"
                                ? "⚡ Bidirectional"
                                : "→ Unidirectional"}{" "}
                              |{pcsQuoteSeparately ? " Quoted Separately" : " Included in System"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="mt-4 rounded-lg p-4"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <p
                          className="text-xs font-medium"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          ⚡ <strong className="text-white">Note:</strong> Input custom values to
                          override calculated specifications. Leave blank to use auto-calculated
                          values based on {storageSizeMW} MW system rating.
                          {pcsQuoteSeparately &&
                            " PCS will be itemized with detailed manufacturer specifications."}
                        </p>
                      </div>
                    </div>

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

                    {/* ProQuote™ Badge + Financial Summary */}
                    <div
                      className="rounded-xl p-6"
                      style={{
                        background: "rgba(59,130,246,0.04)",
                        border: "1px solid rgba(59,130,246,0.12)",
                      }}
                    >
                      {/* Badge row */}
                      <div className="flex items-center gap-3 mb-5">
                        <img
                          src={badgeIcon}
                          alt="ProQuote"
                          className="w-10 h-10 object-contain"
                          style={{ filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.35))" }}
                        />
                        <div>
                          <span className="text-base font-bold text-white tracking-tight">
                            ProQuote™
                          </span>
                          <span
                            className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(59,130,246,0.2)",
                              color: "rgb(147,197,253)",
                            }}
                          >
                            VERIFIED
                          </span>
                        </div>
                      </div>

                      {/* Financial metrics strip */}
                      {financialMetrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Gross Cost */}
                          <div>
                            <p
                              className="text-[11px] font-medium uppercase tracking-wider mb-1"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Total Investment
                            </p>
                            <p className="text-xl font-bold text-white">
                              {localSystemCost >= 1_000_000
                                ? `$${(localSystemCost / 1_000_000).toFixed(2)}M`
                                : `$${(localSystemCost / 1_000).toFixed(0)}K`}
                            </p>
                          </div>
                          {/* ITC Credit */}
                          {(financialMetrics.taxCredit ?? 0) > 0 && (
                            <div>
                              <p
                                className="text-[11px] font-medium uppercase tracking-wider mb-1"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                              >
                                Federal ITC (30%)
                              </p>
                              <p className="text-xl font-bold text-emerald-400">
                                −
                                {financialMetrics.taxCredit >= 1_000_000
                                  ? `$${(financialMetrics.taxCredit / 1_000_000).toFixed(2)}M`
                                  : `$${(financialMetrics.taxCredit / 1_000).toFixed(0)}K`}
                              </p>
                            </div>
                          )}
                          {/* Net Cost */}
                          <div>
                            <p
                              className="text-[11px] font-medium uppercase tracking-wider mb-1"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Net Cost
                            </p>
                            <p className="text-xl font-bold text-blue-400">
                              {(financialMetrics.netCost ?? localSystemCost) >= 1_000_000
                                ? `$${((financialMetrics.netCost ?? localSystemCost) / 1_000_000).toFixed(2)}M`
                                : `$${((financialMetrics.netCost ?? localSystemCost) / 1_000).toFixed(0)}K`}
                            </p>
                          </div>
                          {/* Annual Savings */}
                          <div>
                            <p
                              className="text-[11px] font-medium uppercase tracking-wider mb-1"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Annual Savings
                            </p>
                            <p className="text-xl font-bold text-emerald-400">
                              {estimatedAnnualSavings >= 1_000_000
                                ? `$${(estimatedAnnualSavings / 1_000_000).toFixed(2)}M`
                                : `$${(estimatedAnnualSavings / 1_000).toFixed(0)}K`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payback + ROI row */}
                      {financialMetrics && (
                        <div
                          className="flex items-center gap-6 mt-4 pt-4"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-medium uppercase tracking-wider"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              Payback
                            </span>
                            <span className="text-sm font-bold text-white">
                              {paybackYears.toFixed(1)} yrs
                            </span>
                          </div>
                          {(financialMetrics.npv ?? 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-medium uppercase tracking-wider"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                              >
                                NPV
                              </span>
                              <span className="text-sm font-bold text-emerald-400">
                                ${((financialMetrics.npv ?? 0) / 1_000_000).toFixed(1)}M
                              </span>
                            </div>
                          )}
                          {(financialMetrics.irr ?? 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-medium uppercase tracking-wider"
                                style={{ color: "rgba(255,255,255,0.4)" }}
                              >
                                IRR
                              </span>
                              <span className="text-sm font-bold text-blue-400">
                                {(financialMetrics.irr ?? 0).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-medium uppercase tracking-wider"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              25yr ROI
                            </span>
                            <span className="text-sm font-bold text-emerald-400">
                              {(financialMetrics.roi25Year ?? 0).toFixed(0)}%
                            </span>
                          </div>
                          <button
                            onClick={() => setShowFinancialSummary(true)}
                            className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-md transition-colors"
                            style={{
                              color: "rgb(147,197,253)",
                              background: "rgba(59,130,246,0.1)",
                              border: "1px solid rgba(59,130,246,0.2)",
                            }}
                          >
                            View Full Breakdown →
                          </button>
                        </div>
                      )}

                      {/* Loading state */}
                      {!financialMetrics && isCalculating && (
                        <div className="flex items-center gap-3 py-4">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                            Calculating financials…
                          </span>
                        </div>
                      )}
                    </div>

                    {/* System Summary */}
                    <div
                      className="rounded-xl p-8"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        📊 System Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.15)",
                          }}
                        >
                          <p
                            className="text-sm mb-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            System Rating
                          </p>
                          <p className="text-3xl font-bold text-blue-400">
                            {storageSizeMW.toFixed(1)} MW
                          </p>
                          <p
                            className="text-lg font-bold"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            {storageSizeMWh.toFixed(1)} MWh
                          </p>
                        </div>
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.15)",
                          }}
                        >
                          <p
                            className="text-sm mb-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            Total Cost
                          </p>
                          <p className="text-3xl font-bold text-emerald-400">
                            ${(localSystemCost / 1000000).toFixed(2)}M
                          </p>
                          <p
                            className="text-sm font-bold"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                          </p>
                        </div>
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.15)",
                          }}
                        >
                          <p
                            className="text-sm mb-1 font-medium"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            Application
                          </p>
                          <p className="text-xl font-bold text-emerald-400 capitalize">
                            {applicationType}
                          </p>
                          <p
                            className="text-sm font-bold capitalize"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            {useCase.replace("-", " ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <button
                        onClick={() => setViewMode("landing")}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        ← Back to Tools
                      </button>
                      <button
                        onClick={() => {
                          const _configData = {
                            projectName,
                            location,
                            storageSizeMW,
                            durationHours,
                            storageSizeMWh,
                            systemCost: localSystemCost,
                            applicationType,
                            useCase,
                            chemistry,
                            installationType,
                            gridConnection,
                            inverterEfficiency,
                            roundTripEfficiency,
                            cyclesPerYear,
                            utilityRate,
                            demandCharge,
                            warrantyYears,
                          };
                          onGenerateQuote?.();
                          onClose();
                        }}
                        className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
                        style={{
                          background: "transparent",
                          color: "#34d399",
                          border: "1px solid rgba(16,185,129,0.35)",
                        }}
                      >
                        Generate Detailed Quote →
                      </button>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div
                    className="mt-8 rounded-xl p-6"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      💡 Configuration Guidelines
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-white mb-1">Power & Duration:</p>
                        <ul className="space-y-1 ml-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                          <li>• Peak shaving: 0.5-2 MW, 2-4 hrs</li>
                          <li>• Backup power: 0.5-5 MW, 4-8 hrs</li>
                          <li>• Utility scale: 10-100 MW, 2-4 hrs</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-white mb-1">Battery Chemistry:</p>
                        <ul className="space-y-1 ml-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                          <li>• LFP: Best for daily cycling, safest</li>
                          <li>• NMC: Higher energy density, premium cost</li>
                          <li>• LTO: 20,000+ cycles, fastest charge</li>
                        </ul>
                      </div>
                    </div>
                  </div>
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

        {/* Professional Financial Model View */}
        {viewMode === "professional-model" && (
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
