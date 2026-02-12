import React, { useState, useEffect, useCallback } from "react";
import badgeIcon from "@/assets/images/badge_icon.jpg";
import {
  X,
  Wrench,
  Zap,
  Calculator,
  TrendingUp,
  // Package, // Unused
  FileText,
  ArrowLeft,
  ArrowRight,
  Building2,
  // MapPin, // Unused
  DollarSign,
  Battery,
  // Calendar, // Unused
  Sparkles,
  Cpu,
  GitBranch,
  FileSpreadsheet,
  Eye,
  Sliders,
  Gauge,
  Wand2,
  PiggyBank,
  BarChart3,
  Box,
  ScrollText,
  // Search, // Unused
  Landmark,
  Banknote,
  Lock,
  Crown,
  Download,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
// InteractiveConfigDashboard moved to legacy - feature disabled for V5 cleanup
import {
  generateProfessionalModel,
  type ProfessionalModelResult,
} from "@/services/professionalFinancialModel";
import { QuoteEngine } from "@/core/calculations";
// import type { QuoteResult } from "@/services/unifiedQuoteCalculator"; // Unused
import { type FinancialCalculationResult } from "@/services/centralizedCalculations";
import { calculateSolarSizing } from "@/services/useCasePowerCalculations";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  WidthType,
  AlignmentType,
  HeadingLevel,
  // PageBreak, // Unused
} from "docx";
import { saveAs } from "file-saver";
import merlinImage from "../assets/images/new_profile_merlin.png";
import { DocumentUploadZone } from "./upload/DocumentUploadZone";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";
import ProQuoteFinancialModal, { type ProQuoteFinancialData } from "@/components/shared/ProQuoteFinancialModal";
import ProQuoteRunningCalculator from "@/components/ProQuoteRunningCalculator";
import { ProjectInfoForm } from "./ProjectInfoForm";
import { supabase } from "../services/supabaseClient";
import {
  createLabelValueRow,
  createLabelValueTable,
  createHighlightedLabelValueRow,
} from "@/utils/wordHelpers";

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

type ViewMode = "landing" | "custom-config" | "interactive-dashboard" | "professional-model";

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
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<"word" | "excel">("word");
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // Welcome popup for first-time users
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showMobileCalc, setShowMobileCalc] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{
    projectName?: string;
    projectLocation?: string;
    projectGoals?: string;
    projectSchedule?: string;
    userName?: string;
    email?: string;
    userId?: string;
  } | null>(null);

  // ✅ SSOT: Financial metrics from centralizedCalculations (database-driven)
  const [financialMetrics, setFinancialMetrics] = useState<FinancialCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Derived values from SSOT (with fallbacks during loading)
  const localSystemCost = financialMetrics?.totalProjectCost ?? systemCost;
  const estimatedAnnualSavings = financialMetrics?.annualSavings ?? 0;
  const paybackYears = financialMetrics?.paybackYears ?? 0;

  // NEW: Professional Financial Model state
  const [professionalModel, setProfessionalModel] = useState<ProfessionalModelResult | null>(null);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [selectedISORegion, setSelectedISORegion] = useState<
    "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | "SPP"
  >("CAISO");
  const [projectLeverage, setProjectLeverage] = useState(60); // % debt
  const [interestRate, setInterestRate] = useState(7); // %
  const [loanTermYears, setLoanTermYears] = useState(15);

  // NEW: State for Interactive Dashboard integration
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);

  // NEW: Document Upload / Path A state
  const [extractedData, setExtractedData] = useState<ExtractedSpecsData | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<ParsedDocument[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(true);

  // Extended configuration state
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [applicationType, setApplicationType] = useState("commercial");
  const [useCase, setUseCase] = useState("peak-shaving");
  const [chemistry, setChemistry] = useState("lfp");
  const [roundTripEfficiency, setRoundTripEfficiency] = useState(90);
  const [warrantyYears, setWarrantyYears] = useState(10);
  const [cyclesPerYear, setCyclesPerYear] = useState(365);
  const [utilityRate, setUtilityRate] = useState(0.12);
  const [demandCharge, setDemandCharge] = useState(15);
  const [installationType, setInstallationType] = useState("outdoor");
  const [gridConnection, setGridConnection] = useState("ac-coupled");
  const [inverterEfficiency, setInverterEfficiency] = useState(96);

  // NEW: Electrical Specifications
  const [systemVoltage, setSystemVoltage] = useState(480); // Volts AC
  const [dcVoltage, setDcVoltage] = useState(1000); // Volts DC
  const [inverterType, setInverterType] = useState("bidirectional"); // bidirectional or unidirectional
  const [inverterManufacturer, setInverterManufacturer] = useState("");
  const [inverterRating, setInverterRating] = useState(2500); // kW per inverter
  const [pcsQuoteSeparately, setPcsQuoteSeparately] = useState(false); // Quote PCS separately vs included
  const [numberOfInvertersInput, setNumberOfInvertersInput] = useState(1); // Manual override
  const [switchgearType, setSwitchgearType] = useState("medium-voltage");
  const [switchgearRating, setSwitchgearRating] = useState(5000); // Amps
  const [bmsType, setBmsType] = useState("distributed");
  const [bmsManufacturer, setBmsManufacturer] = useState("");
  const [transformerRequired, setTransformerRequired] = useState(true);
  const [transformerRating, setTransformerRating] = useState(3000); // kVA
  const [transformerVoltage, setTransformerVoltage] = useState("480V/12470V");

  // NEW: User-specified electrical inputs (optional overrides)
  const [systemWattsInput, setSystemWattsInput] = useState<number | "">(""); // User input for watts
  const [systemAmpsACInput, setSystemAmpsACInput] = useState<number | "">(""); // User input for AC amps
  const [systemAmpsDCInput, setSystemAmpsDCInput] = useState<number | "">(""); // User input for DC amps

  // NEW: Renewables & Alternative Power
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarPVIncluded, setSolarPVIncluded] = useState(false);
  const [solarCapacityKW, setSolarCapacityKW] = useState(1000);
  const [solarPanelType, setSolarPanelType] = useState("monocrystalline");
  const [solarPanelEfficiency, setSolarPanelEfficiency] = useState(21);
  const [solarInverterType, setSolarInverterType] = useState("string");
  const [windTurbineIncluded, setWindTurbineIncluded] = useState(false);
  const [windCapacityKW, setWindCapacityKW] = useState(500);
  const [windTurbineType, setWindTurbineType] = useState("horizontal");
  const [fuelCellIncluded, setFuelCellIncluded] = useState(false);
  const [fuelCellCapacityKW, setFuelCellCapacityKW] = useState(250);
  const [fuelCellType, setFuelCellType] = useState("pem");
  const [fuelType, setFuelType] = useState("hydrogen");
  const [dieselGenIncluded, setDieselGenIncluded] = useState(false);
  const [dieselGenCapacityKW, setDieselGenCapacityKW] = useState(500);
  const [naturalGasGenIncluded, setNaturalGasGenIncluded] = useState(false);
  const [naturalGasCapacityKW, setNaturalGasCapacityKW] = useState(750);

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
  const requiredTransformerKVA = totalKW * 1.25; // 25% safety factor

  // ✅ SSOT: Use unifiedQuoteCalculator.calculateQuote() - THE TRUE SINGLE ENTRY POINT
  // This properly combines:
  // 1. equipmentCalculations.ts → Equipment costs (batteries, solar, wind, generators, EV)
  // 2. centralizedCalculations.ts → Financial metrics (ROI, NPV, payback)
  useEffect(() => {
    const calculateFromSSoT = async () => {
      setIsCalculating(true);
      try {
        // Calculate solar/wind/generator MW from kW if included
        const solarMWFromConfig = solarPVIncluded ? solarCapacityKW / 1000 : 0;
        const windMWFromConfig = windTurbineIncluded ? windCapacityKW / 1000 : 0;
        const generatorMWFromConfig =
          (dieselGenIncluded ? dieselGenCapacityKW / 1000 : 0) +
          (naturalGasGenIncluded ? naturalGasCapacityKW / 1000 : 0);

        // Calculate fuel cell MW from kW if included (NEW - Dec 2025)
        const fuelCellMWFromConfig = fuelCellIncluded ? fuelCellCapacityKW / 1000 : 0;

        // Determine generator fuel type (diesel takes precedence if both are included)
        const generatorFuelTypeForQuote = dieselGenIncluded
          ? ("diesel" as const)
          : naturalGasGenIncluded
            ? ("natural-gas" as const)
            : ("diesel" as const);

        // Map fuelType state to FuelCellType for SSOT
        const fuelCellTypeForQuote =
          fuelType === "natural-gas"
            ? ("natural-gas-fc" as const)
            : fuelType === "solid-oxide"
              ? ("solid-oxide" as const)
              : ("hydrogen" as const);

        // Map gridConnection to valid type (hybrid → limited for quote calculator)
        const mappedGridConnection =
          gridConnection === "hybrid"
            ? "limited"
            : gridConnection === "ac-coupled" || gridConnection === "dc-coupled"
              ? "on-grid"
              : (gridConnection as "on-grid" | "off-grid" | "limited");

        // ✅ SINGLE SOURCE OF TRUTH: QuoteEngine.generateQuote() orchestrates ALL calculations
        const quoteResult = await QuoteEngine.generateQuote({
          storageSizeMW,
          durationHours,
          solarMW: solarMWFromConfig,
          windMW: windMWFromConfig,
          generatorMW: generatorMWFromConfig,
          generatorFuelType: generatorFuelTypeForQuote, // NEW: Pass fuel type to SSOT
          fuelCellMW: fuelCellMWFromConfig, // NEW: Pass fuel cell MW to SSOT
          fuelCellType: fuelCellTypeForQuote, // NEW: Pass fuel cell type to SSOT
          location: location || "United States",
          electricityRate: utilityRate,
          gridConnection: mappedGridConnection,
          useCase: useCase,
        });

        // Map QuoteResult to FinancialCalculationResult for compatibility
        setFinancialMetrics({
          ...quoteResult.financials,
          equipmentCost: quoteResult.costs.equipmentCost,
          installationCost: quoteResult.costs.installationCost,
          shippingCost: 0, // Not in QuoteResult.costs - included in equipment already
          tariffCost: 0, // Not in QuoteResult.costs - included in equipment already
          totalProjectCost: quoteResult.costs.totalProjectCost,
          taxCredit: quoteResult.costs.taxCredit,
          netCost: quoteResult.costs.netCost,
        } as FinancialCalculationResult);

        // Notify parent component
        onSystemCostChange(quoteResult.costs.totalProjectCost);
      } catch (error) {
        console.error("❌ Error calculating from SSOT:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateFromSSoT();
  }, [
    storageSizeMW,
    durationHours,
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    dieselGenIncluded,
    dieselGenCapacityKW,
    naturalGasGenIncluded,
    naturalGasCapacityKW,
    fuelCellIncluded,
    fuelCellCapacityKW,
    fuelType, // NEW: Fuel cell dependencies
    location,
    utilityRate,
    gridConnection,
    useCase,
    onSystemCostChange,
  ]);

  // Sync Interactive Dashboard renewable values to Custom Configuration form
  useEffect(() => {
    if (viewMode === "custom-config") {
      // If user set solar in Interactive Dashboard, enable solar in form
      if (solarMW > 0) {
        setIncludeRenewables(true);
        setSolarPVIncluded(true);
        setSolarCapacityKW(solarMW * 1000); // Convert MW to kW
      }

      // If user set wind in Interactive Dashboard, enable wind in form
      if (windMW > 0) {
        setIncludeRenewables(true);
        setWindTurbineIncluded(true);
        setWindCapacityKW(windMW * 1000); // Convert MW to kW
      }

      // If user set generator in Interactive Dashboard, enable diesel gen in form
      if (generatorMW > 0) {
        setIncludeRenewables(true);
        setDieselGenIncluded(true);
        setDieselGenCapacityKW(generatorMW * 1000); // Convert MW to kW
      }
    }
  }, [viewMode, solarMW, windMW, generatorMW]);

  // Check if wizard config exists in sessionStorage
  const [hasWizardConfig, setHasWizardConfig] = useState(false);

  useEffect(() => {
    setHasWizardConfig(!!sessionStorage.getItem("advancedBuilderConfig"));
  }, [show]);

  // Load wizard values from sessionStorage when navigating to custom-config view
  const loadWizardConfig = useCallback(() => {
    try {
      const configData = sessionStorage.getItem("advancedBuilderConfig");
      if (configData) {
        const config = JSON.parse(configData);
        console.log("✅ Loading wizard config into Advanced Builder:", config);

        // Set battery/storage values (convert kW to MW)
        if (config.batteryKW) {
          const batteryMW = config.batteryKW / 1000;
          onStorageSizeChange(batteryMW);
        }

        // Set duration
        if (config.durationHours) {
          onDurationChange(config.durationHours);
        }

        // Set solar (convert kW to MW)
        if (config.solarKW && config.solarKW > 0) {
          setSolarMW(config.solarKW / 1000);
          setIncludeRenewables(true);
          setSolarPVIncluded(true);
          setSolarCapacityKW(config.solarKW);
        }

        // Set generator (convert kW to MW and enable)
        if (config.generatorKW && config.generatorKW > 0) {
          setGeneratorMW(config.generatorKW / 1000);
          setIncludeRenewables(true);
          setDieselGenIncluded(true);
          setDieselGenCapacityKW(config.generatorKW);
        }

        // Set location/state
        if (config.state) {
          setLocation(config.state);
        }

        // Set utility rate
        if (config.electricityRate) {
          setUtilityRate(config.electricityRate);
        }

        // Set use case
        if (config.selectedIndustry) {
          setUseCase(config.selectedIndustry.replace(/-/g, "-"));
        }

        // Set project name if available
        if (config.selectedIndustry) {
          setProjectName(
            `${config.selectedIndustry.charAt(0).toUpperCase() + config.selectedIndustry.slice(1).replace(/-/g, " ")} Project`
          );
        }

        // Clear sessionStorage after loading
        sessionStorage.removeItem("advancedBuilderConfig");
        setHasWizardConfig(false);
      }
    } catch (error) {
      console.error("❌ Error loading wizard config:", error);
    }
  }, [onStorageSizeChange, onDurationChange]);

  // Reset to initialView when modal opens AND load wizard config if needed
  useEffect(() => {
    if (show) {
      setViewMode(initialView);
      window.scrollTo(0, 0);

      // Load wizard config immediately if we're going to custom-config view
      if (initialView === "custom-config") {
        // Small delay to ensure state is set
        setTimeout(() => {
          loadWizardConfig();
        }, 100);
      }
    }
  }, [show, initialView, loadWizardConfig]);

  // Also load wizard config when viewMode changes to custom-config (backup)
  useEffect(() => {
    if (show && viewMode === "custom-config") {
      const configData = sessionStorage.getItem("advancedBuilderConfig");
      if (configData) {
        loadWizardConfig();
      }
    }
  }, [show, viewMode, loadWizardConfig]);

  // Handler for document extraction completion (Path A)
  const handleExtractionComplete = useCallback(
    (data: ExtractedSpecsData, documents: ParsedDocument[]) => {
      if (import.meta.env.DEV) {
        console.log("📄 [AdvancedQuoteBuilder] Extraction complete:", data);
      }

      setExtractedData(data);
      setUploadedDocuments(documents);

      // Pre-populate form fields from extracted data
      if (data.location?.state) {
        setLocation(data.location.state);
      }

      if (data.powerRequirements?.peakDemandKW) {
        // Convert kW to MW for storage size (rough estimate: BESS covers 50% of peak)
        const demandMW = data.powerRequirements.peakDemandKW / 1000;
        onStorageSizeChange(Math.ceil(demandMW * 0.5 * 10) / 10);
      }

      if (data.utilityInfo?.electricityRate) {
        setUtilityRate(data.utilityInfo.electricityRate);
      }

      if (data.utilityInfo?.demandCharge) {
        setDemandCharge(data.utilityInfo.demandCharge);
      }

      if (data.existingInfrastructure?.hasSolar && data.existingInfrastructure.solarKW) {
        setSolarPVIncluded(true);
        setIncludeRenewables(true);
        setSolarCapacityKW(data.existingInfrastructure.solarKW);
        setSolarMW(data.existingInfrastructure.solarKW / 1000);
      }

      if (data.existingInfrastructure?.hasGenerator && data.existingInfrastructure.generatorKW) {
        setDieselGenIncluded(true);
        setIncludeRenewables(true);
        setDieselGenCapacityKW(data.existingInfrastructure.generatorKW);
        setGeneratorMW(data.existingInfrastructure.generatorKW / 1000);
      }

      // Collapse upload section after successful extraction
      setShowUploadSection(false);
    },
    [onStorageSizeChange]
  );

  if (!show) return null;

  // Tool cards configuration - organized into tiers
  // CORE: Always available | PROFESSIONAL: Premium badge | PREMIUM: Locked/teased
  const tools = [
    // === CORE TOOLS (Row 1) ===
    {
      id: "custom-config",
      icon: <Sliders className="w-8 h-8" />,
      title: "System Configuration",
      description:
        "Design your complete BESS system with electrical specs, renewables, and detailed parameters",
      color: "from-blue-500 via-indigo-500 to-purple-600",
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
    // === PROFESSIONAL TOOLS (Row 2) ===
    {
      id: "professional-financial",
      icon: <Landmark className="w-8 h-8" />,
      title: "Bank-Ready Model",
      description: "3-Statement pro-forma with DSCR, LCOS, IRR, MACRS, and revenue stacking",
      color: "from-amber-400 via-yellow-500 to-orange-600",
      action: () => setViewMode("professional-model"),
      tier: "professional",
      badge: "NEW",
    },
    {
      id: "quote-preview",
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: "Quote Export",
      description: "Generate professional quotes in Word and Excel formats",
      color: "from-blue-400 via-indigo-500 to-purple-600",
      action: () => setShowQuotePreview(true),
      tier: "professional",
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
      tier: "professional",
    },
    // === PREMIUM TOOLS (Row 3 - Teased/Locked) ===
    {
      id: "market-analytics",
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Market Analytics",
      description: "Market trends, pricing intelligence, and competitive analysis",
      color: "from-orange-400 via-amber-500 to-orange-600",
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
      color: "from-indigo-400 via-purple-500 to-violet-600",
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
      color: "from-purple-400 via-indigo-500 to-violet-600",
      action: () => {
        alert("🤖 AI Optimizer\n\nAdvanced AI-powered system optimization.\n\n✨ Coming Q1 2026");
      },
      tier: "premium",
      locked: true,
      comingSoon: true,
    },
  ];

  // Export handler function
  const handleExportQuote = async (format: "word" | "excel" | "pdf") => {
    // Check authentication - require project info (account creation)
    if (!projectInfo) {
      alert(
        "Please complete the Project Information form at the top of the page to create your account and download quotes."
      );
      return;
    }

    // Double-check Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !projectInfo.userId) {
      alert("Account authentication required. Please complete the Project Information form.");
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (format === "word") {
        // ✅ SINGLE SOURCE OF TRUTH: Use QuoteEngine for ALL pricing/financials
        const quoteResult = await QuoteEngine.generateQuote({
          storageSizeMW,
          durationHours,
          solarMW: solarPVIncluded ? solarCapacityKW / 1000 : 0,
          windMW: windTurbineIncluded ? windCapacityKW / 1000 : 0,
          generatorMW:
            (dieselGenIncluded ? dieselGenCapacityKW / 1000 : 0) +
            (naturalGasGenIncluded ? naturalGasCapacityKW / 1000 : 0),
          generatorFuelType: dieselGenIncluded
            ? "diesel"
            : naturalGasGenIncluded
              ? "natural-gas"
              : "natural-gas", // SSOT Dec 2025: default to natural-gas
          fuelCellMW: fuelCellIncluded ? fuelCellCapacityKW / 1000 : 0,
          fuelCellType:
            fuelType === "natural-gas"
              ? "natural-gas-fc"
              : fuelType === "solid-oxide"
                ? "solid-oxide"
                : "hydrogen",
          location: location || "California",
          electricityRate: utilityRate,
          gridConnection:
            gridConnection === "off-grid"
              ? "off-grid"
              : gridConnection === "ac-coupled"
                ? "on-grid"
                : "limited",
          useCase: useCase,
        });

        // Extract values from unified calculator
        const totalMWh = storageSizeMW * durationHours;
        const effectiveBatteryKwh = totalMWh * 1000;
        const bessCapEx = quoteResult.equipment.batteries.totalCost;
        const solarCost = quoteResult.equipment.solar?.totalCost || 0;
        const windCost = quoteResult.equipment.wind?.totalCost || 0;
        const totalProjectCost = quoteResult.costs.totalProjectCost;
        const annualSavings = quoteResult.financials.annualSavings;
        const paybackYears = quoteResult.financials.paybackYears;
        const roi25Year = quoteResult.financials.roi25Year;

        const doc = new Document({
          sections: [
            {
              children: [
                // Header
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "⚡ MERLIN Energy",
                      bold: true,
                      size: 48,
                      color: "7C3AED",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Energy Storage System Quote",
                      size: 28,
                      color: "4F46E5",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),

                // Quote Info
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote #MER-${Math.floor(Math.random() * 10000)
                        .toString()
                        .padStart(4, "0")}`,
                      size: 20,
                    }),
                    new TextRun({ text: `  |  ${new Date().toLocaleDateString()}`, size: 20 }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 400 },
                }),

                // Project Information Section
                new Paragraph({
                  text: "PROJECT INFORMATION",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["Project Name:", projectName || "BESS Project"],
                    ["Location:", location || "Not specified"],
                    [
                      "Application:",
                      applicationType.charAt(0).toUpperCase() + applicationType.slice(1),
                    ],
                    [
                      "Use Case:",
                      useCase.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                    ],
                  ],
                  30
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // System Specifications Section
                new Paragraph({
                  text: "SYSTEM SPECIFICATIONS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["Power Rating:", `${storageSizeMW.toFixed(2)} MW`],
                    [
                      "Energy Capacity:",
                      `${totalMWh.toFixed(2)} MWh (${effectiveBatteryKwh.toLocaleString()} kWh)`,
                    ],
                    ["Duration:", `${durationHours} hours`],
                    ["Battery Chemistry:", chemistry.toUpperCase()],
                    ["Round-Trip Efficiency:", `${roundTripEfficiency}%`],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Electrical Specifications
                new Paragraph({
                  text: "ELECTRICAL SPECIFICATIONS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["AC System Voltage:", `${systemVoltage}V`],
                    ["DC Battery Voltage:", `${dcVoltage}V`],
                    [
                      "Inverter Type:",
                      inverterType === "bidirectional" ? "Bidirectional" : "Unidirectional",
                    ],
                    ["Number of Inverters:", `${numberOfInverters} units @ ${inverterRating} kW each`],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Pricing Section
                new Paragraph({
                  text: "PRICING & INVESTMENT",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    createLabelValueRow("BESS Equipment:", `$${bessCapEx.toLocaleString()}`),
                    createLabelValueRow(
                      "BOS & Installation:",
                      `$${(bessCapEx * 0.25).toLocaleString()}`
                    ),
                    ...(solarPVIncluded
                      ? [createLabelValueRow("Solar PV System:", `$${solarCost.toLocaleString()}`)]
                      : []),
                    ...(windTurbineIncluded
                      ? [createLabelValueRow("Wind System:", `$${windCost.toLocaleString()}`)]
                      : []),
                    // Special formatted total row
                    createHighlightedLabelValueRow(
                      "TOTAL PROJECT COST:",
                      `$${totalProjectCost.toLocaleString()}`
                    ),
                  ],
                }),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Financial Analysis
                new Paragraph({
                  text: "FINANCIAL ANALYSIS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    [
                      "Estimated Annual Savings:",
                      `$${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    ],
                    ["Simple Payback:", `${paybackYears.toFixed(1)} years`],
                    ["25-Year ROI:", `${roi25Year.toFixed(0)}%`],
                    [
                      "Cost per kWh:",
                      `$${(totalProjectCost / effectiveBatteryKwh).toFixed(2)}/kWh`,
                    ],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 400 } }),

                // Footer
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Generated by MERLIN Energy Quote Builder",
                      italics: true,
                      size: 18,
                      color: "9CA3AF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `© ${new Date().getFullYear()} MERLIN Energy. All rights reserved.`,
                      italics: true,
                      size: 16,
                      color: "9CA3AF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        const fileName = `${(projectName || "BESS_Quote").replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.docx`;
        saveAs(blob, fileName);
        setExportSuccess(true);

        setTimeout(() => {
          setExportSuccess(false);
        }, 3000);
      } else if (format === "excel") {
        alert(
          "📊 Excel Export\n\nExcel export coming soon!\nFor now, use Word export for full quotes."
        );
      } else if (format === "pdf") {
        alert(
          "📄 PDF Export\n\nPDF export coming soon!\nFor now, use Word export and convert to PDF."
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: '#0f1117' }}>
      <div className="min-h-screen text-gray-100">
        {/* LANDING PAGE VIEW */}
        {viewMode === "landing" && (
          <>
            {/* Premium header - sleek dark with amber accent line */}
            <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(15, 17, 23, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={badgeIcon}
                      alt="ProQuote Badge"
                      className="w-12 h-12 object-contain"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                      }}
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        ProQuote
                      </h1>
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Professional-grade BESS configuration
                      </p>
                    </div>
                  </div>

                  {/* Quick Access Buttons */}
                  <div className="hidden lg:flex items-center gap-3">
                    <button
                      onClick={() => setShowHowItWorks(true)}
                      className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-300">How It Works</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("custom-config");
                        setTimeout(() => {
                          const electricalSection = document.querySelector(
                            '[data-section="electrical"]'
                          );
                          if (electricalSection) {
                            electricalSection.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; }}
                    >
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-white">Electrical</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("custom-config");
                        setTimeout(() => {
                          const renewablesSection = document.querySelector(
                            '[data-section="renewables"]'
                          );
                          if (renewablesSection) {
                            renewablesSection.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'; }}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">Renewables</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("custom-config");
                        setTimeout(() => {
                          const financialSection = document.querySelector(
                            '[data-section="financial"]'
                          );
                          if (financialSection) {
                            financialSection.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                      style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; }}
                    >
                      <Calculator className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-white">Financial</span>
                    </button>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* BESS Market Pricing Intelligence - Clean horizontal strip */}
            <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: 20 }}>
                  <TrendingUp className="w-4 h-4" style={{ color: '#fbbf24' }} />
                  <span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>Market Pricing</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 20 }}>
                  <Battery className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">$200/kWh</span>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>≤2 MWh</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 20 }}>
                  <Battery className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-bold text-white">$155/kWh</span>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>2–15 MWh</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 20 }}>
                  <Battery className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">$140/kWh</span>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>15+ MWh</span>
                </div>
                <div className="px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Q4 2025</span>
                </div>
              </div>
            </div>

            {/* System Configuration Hero Panel - START HERE */}
            <div className="max-w-7xl mx-auto px-6 pb-6">
              <div className="group w-full relative rounded-xl p-10 md:p-14 text-left transition-all duration-300 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="relative flex flex-col md:flex-row items-center gap-10 md:gap-12">
                  {/* Merlin on the left */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 md:w-44 md:h-44 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img
                        src={merlinImage}
                        alt="Merlin"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Content on the right */}
                  <div className="flex-1">
                    {/* START HERE badge */}
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-md mb-5" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                      START HERE
                    </span>

                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                      System Configuration
                    </h3>
                    <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Design your complete BESS system with professional-grade tools.
                      Configure electrical specifications, renewable energy integration,
                      and all system parameters in one place.
                    </p>

                    {/* Feature highlights */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                        <div>
                          <p className="font-semibold text-white mb-1">Professional Tools</p>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Advanced configuration, detailed electrical specs, and real-time calculations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }} />
                        <div>
                          <p className="font-semibold text-white mb-1">Save Time & Money</p>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Instant feedback and market intelligence to optimize your design
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Large Launch button - amber to match brand */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewMode("custom-config");
                        if (hasWizardConfig) {
                          loadWizardConfig();
                        }
                      }}
                      className="group/btn w-full md:w-auto px-8 py-3.5 font-semibold text-base rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.15)'; }}
                    >
                      <Sliders className="w-5 h-5" />
                      <span>Launch Configuration Tool</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Section - Path A */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  className="flex items-center justify-between cursor-pointer p-6"
                  onClick={() => setShowUploadSection(!showUploadSection)}
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    Upload Existing Specs
                    {extractedData && (
                      <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30">
                        ✓ Data Extracted
                      </span>
                    )}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showUploadSection ? "rotate-180" : ""}`}
                  />
                </div>

                {showUploadSection && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 text-sm mb-4">
                      Have utility bills, equipment schedules, or load profiles? Upload them and let
                      AI extract the data to pre-populate your quote.
                    </p>
                    <DocumentUploadZone
                      onExtractionComplete={handleExtractionComplete}
                      onError={(error) => {
                        if (import.meta.env.DEV) {
                          console.error("Upload error:", error);
                        }
                      }}
                      maxFiles={5}
                    />
                    <p className="text-center text-gray-500 text-sm mt-6">
                      — or configure your system manually below —
                    </p>
                  </div>
                )}

                {extractedData && !showUploadSection && (
                  <div className="px-6 pb-6">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <p className="text-sm text-purple-300 mb-3">
                        Pre-filled from uploaded documents:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.powerRequirements?.peakDemandKW && (
                          <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                            {extractedData.powerRequirements.peakDemandKW.toLocaleString()} kW peak
                          </span>
                        )}
                        {extractedData.powerRequirements?.monthlyKWh && (
                          <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                            {extractedData.powerRequirements.monthlyKWh.toLocaleString()} kWh/month
                          </span>
                        )}
                        {extractedData.location?.state && (
                          <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                            📍 {extractedData.location.state}
                          </span>
                        )}
                        {extractedData.utilityInfo?.electricityRate && (
                          <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                            ${extractedData.utilityInfo.electricityRate.toFixed(4)}/kWh
                          </span>
                        )}
                        {extractedData.utilityInfo?.demandCharge && (
                          <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700">
                            ${extractedData.utilityInfo.demandCharge.toFixed(2)}/kW demand
                          </span>
                        )}
                        {extractedData.existingInfrastructure?.hasSolar && (
                          <span className="px-3 py-1.5 bg-amber-800/50 rounded-lg text-sm text-amber-300 border border-amber-700/50">
                            ☀️ {extractedData.existingInfrastructure.solarKW} kW solar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Welcome Popup Modal */}
            {showWelcomePopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4, 8, 20, 0.8)', backdropFilter: 'blur(8px)' }}>
                <div className="rounded-xl max-w-lg w-full overflow-hidden animate-fadeIn" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* Header with Merlin */}
                  <div className="p-8 pb-6 text-center relative">
                    <img
                      src={merlinImage}
                      alt="Merlin"
                      className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl"
                    />
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Welcome to ProQuote
                    </h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Professional-grade BESS configuration tools
                    </p>
                  </div>

                  {/* Tools explanation */}
                  <div className="px-6 pb-2 space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                        <Sliders className="w-5 h-5" style={{ color: '#fbbf24' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">System Configuration</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Design your BESS system with detailed electrical specs, renewable integration, and all parameters.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Gauge className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">Interactive Dashboard</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Fine-tune with real-time sliders. See instant cost and ROI updates as you adjust.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        <Landmark className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">Bank-Ready Model</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Generate 3-statement financial models for investors. Includes DSCR, IRR, and MACRS.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="p-6">
                    <button
                      onClick={() => setShowWelcomePopup(false)}
                      className="w-full font-semibold py-3 px-6 rounded-lg transition-all"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                    >
                      Let's Build a Quote →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tool cards grid - Merlin themed */}
            <div className="max-w-7xl mx-auto px-6 py-12">
              {/* Section: Other Core Tools */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                  <Wrench className="w-5 h-5" style={{ color: '#fbbf24' }} />
                  Configuration Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tools
                    .filter((t) => t.tier === "core" && t.id !== "custom-config")
                    .map((tool, index) => (
                      <button
                        key={tool.id}
                        onClick={tool.action}
                        style={{ animationDelay: `${index * 100}ms`, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        className="group relative rounded-xl p-6 text-left transition-all duration-200 hover:-translate-y-1 animate-fadeIn overflow-hidden hover:border-white/15"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        {/* Icon */}
                        <div className="relative mb-4 inline-flex">
                          <div className="p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                            <div className="text-blue-400">{tool.icon}</div>
                          </div>
                        </div>

                        {/* Content */}
                        <h4 className="relative text-lg font-semibold mb-2 text-white">
                          {tool.title}
                        </h4>
                        <p className="relative text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {tool.description}
                        </p>

                        {/* Arrow */}
                        <div className="relative mt-4 flex items-center transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          <span className="text-xs font-semibold">Open Tool</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Section: Professional Tools */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                  <Crown className="w-5 h-5" style={{ color: '#fbbf24' }} />
                  Professional Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools
                    .filter((t) => t.tier === "professional")
                    .map((tool, index) => (
                      <button
                        key={tool.id}
                        onClick={tool.action}
                        style={{ animationDelay: `${(index + 3) * 100}ms`, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        className="group relative rounded-xl p-6 text-left transition-all duration-200 hover:-translate-y-1 animate-fadeIn overflow-hidden"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        {/* Badge */}
                        {"badge" in tool && tool.badge && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fbbf24', color: '#1a0a2e' }}>
                              {tool.badge}
                            </span>
                          </div>
                        )}

                        {/* Icon */}
                        <div className="relative mb-4 inline-flex">
                          <div className="p-3 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.08)' }}>
                            <div style={{ color: '#fbbf24' }}>{tool.icon}</div>
                          </div>
                        </div>

                        {/* Content */}
                        <h4 className="relative text-lg font-semibold mb-2 text-white">
                          {tool.title}
                        </h4>
                        <p className="relative text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {tool.description}
                        </p>

                        {/* Arrow */}
                        <div className="relative mt-4 flex items-center transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          <span className="text-xs font-semibold">Open Tool</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>

                        {/* Bottom accent */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.color} opacity-50 group-hover:opacity-100 transition-opacity`}
                        />
                      </button>
                    ))}
                </div>
              </div>

              {/* Section: Premium Tools */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Premium Features
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    Upgrade to unlock
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tools
                    .filter((t) => t.tier === "premium")
                    .map((tool, index) => (
                      <button
                        key={tool.id}
                        onClick={"locked" in tool && tool.locked ? undefined : tool.action}
                        disabled={"locked" in tool && tool.locked}
                        className={`group relative rounded-xl p-6 text-left transition-all duration-300 animate-fadeIn overflow-hidden ${
                          "locked" in tool && tool.locked ? "opacity-75 cursor-not-allowed" : "hover:-translate-y-1"
                        }`}
                        style={{ animationDelay: `${(index + 6) * 100}ms`, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        onMouseEnter={(e) => { if (!("locked" in tool) || !tool.locked) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        {/* Lock overlay for locked tools */}
                        {"locked" in tool && tool.locked && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl z-10 flex items-center justify-center">
                            <div className="text-center">
                              <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                              {"comingSoon" in tool && tool.comingSoon && (
                                <span className="text-xs text-slate-400 font-medium">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </div>
                        )}


                        {/* Icon */}
                        <div className="relative mb-4 inline-flex">
                          <div
                            className={`bg-gradient-to-br ${tool.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-all duration-300`}
                          >
                            <div className="text-white">{tool.icon}</div>
                          </div>
                        </div>

                        {/* Content */}
                        <h4 className="relative text-lg font-semibold mb-2 text-white transition-colors">
                          {tool.title}
                        </h4>
                        <p className="relative text-sm leading-relaxed transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {tool.description}
                        </p>

                        {/* Arrow or Lock indicator */}
                        <div className="relative mt-4 flex items-center transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {"locked" in tool && tool.locked ? (
                            <span className="text-xs font-semibold text-slate-500">
                              Premium Feature
                            </span>
                          ) : (
                            <>
                              <span className="text-xs font-semibold">Open Tool</span>
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                            </>
                          )}
                        </div>

                        {/* Bottom accent */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.color} opacity-50 group-hover:opacity-100 transition-opacity`}
                        />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            CUSTOM CONFIGURATION VIEW - REDESIGNED WITH TAB NAVIGATION & LIVE FINANCIALS
            ════════════════════════════════════════════════════════════════════════════ */}
        {viewMode === "custom-config" && (
          <div className="min-h-screen relative overflow-hidden" style={{ background: '#0f1117' }}>

            {/* ═══ STICKY HEADER WITH TAB NAVIGATION ═══ */}
            <div className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(15, 17, 23, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">How It Works</span>
                  </button>
                  <button
                    onClick={() => setShowFinancialSummary(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Financial Summary</span>
                  </button>
                  <button
                    onClick={() => setViewMode("professional-model")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-all border border-amber-500/40"
                  >
                    <Landmark className="w-4 h-4" />
                    <span className="hidden sm:inline">Bank Model</span>
                  </button>
                  <button
                    onClick={() => setShowQuotePreview(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-all border border-emerald-500/40"
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
            <div className="max-w-7xl mx-auto px-4 py-6 relative z-0">
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

            {/* ═══ MAIN CONFIGURATION — 2-COLUMN: FORM + RUNNING CALCULATOR ═══ */}
            <div className="max-w-[1440px] mx-auto px-4 py-6 relative z-0">
              <div className="flex gap-6">
                {/* LEFT COLUMN: Configuration Form */}
                <div className="flex-1 min-w-0 space-y-6">
                {/* ────────────────────────────────────────────────
                    SECTION: SYSTEM CONFIGURATION
                    ──────────────────────────────────────────────── */}
                <div
                  data-section="system"
                  className="scroll-mt-48 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {/* Section Header */}
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <Battery className="w-5 h-5 text-blue-400" />
                      </div>
                      System Configuration
                      <span className="text-xs font-normal ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Core BESS Parameters
                      </span>
                    </h3>
                  </div>

                  {/* Section Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Power Capacity - Full Width Slider */}
                      <div className="lg:col-span-2 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Power Capacity
                          </label>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
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
                            style={{ background: `linear-gradient(to right, #3b82f6 ${((storageSizeMW - 0.1) / 9.9) * 100}%, rgba(255,255,255,0.08) ${((storageSizeMW - 0.1) / 9.9) * 100}%)` }}
                          />
                          <div className="relative">
                            <input
                              type="number"
                              value={storageSizeMW}
                              onChange={(e) => onStorageSizeChange(parseFloat(e.target.value) || 0.1)}
                              step="0.1"
                              min="0.1"
                              max="50"
                              className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }}>MW</span>
                          </div>
                        </div>
                      </div>

                      {/* Duration - Full Width Slider */}
                      <div className="lg:col-span-2 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Duration
                          </label>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
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
                            style={{ background: `linear-gradient(to right, #6366f1 ${((durationHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) ${((durationHours - 0.5) / 11.5) * 100}%)` }}
                          />
                          <div className="relative">
                            <input
                              type="number"
                              value={durationHours}
                              onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.5)}
                              step="0.5"
                              min="0.5"
                              max="24"
                              className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }}>hrs</span>
                          </div>
                        </div>
                      </div>

                      {/* Battery Chemistry */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Battery Chemistry
                        </label>
                        <select
                          value={chemistry}
                          onChange={(e) => setChemistry(e.target.value)}
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="lfp">LiFePO4 (LFP) - Long life, safe</option>
                          <option value="nmc">NMC - High energy density</option>
                          <option value="lto">LTO - Ultra-long life</option>
                          <option value="sodium-ion">Sodium-Ion - Low cost</option>
                        </select>
                      </div>

                      {/* Installation Type */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Installation Type
                        </label>
                        <select
                          value={installationType}
                          onChange={(e) => setInstallationType(e.target.value)}
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="outdoor">Outdoor (Containerized)</option>
                          <option value="indoor">Indoor (Room/Vault)</option>
                          <option value="rooftop">Rooftop</option>
                        </select>
                      </div>

                      {/* Grid Connection */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Grid Connection
                        </label>
                        <select
                          value={gridConnection}
                          onChange={(e) => setGridConnection(e.target.value)}
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="ac-coupled">AC-Coupled (Grid-tied)</option>
                          <option value="dc-coupled">DC-Coupled (with Solar)</option>
                          <option value="hybrid">Hybrid (AC+DC)</option>
                          <option value="off-grid">Off-Grid/Island Mode</option>
                        </select>
                      </div>

                      {/* Inverter Efficiency */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Inverter Efficiency (%)
                        </label>
                        <input
                          type="number"
                          value={inverterEfficiency}
                          onChange={(e) => setInverterEfficiency(parseFloat(e.target.value) || 90)}
                          min="85"
                          max="99"
                          step="0.5"
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      Application & Use Case
                      <span className="text-xs font-normal ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        How you'll use the system
                      </span>
                    </h3>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Application Type
                        </label>
                        <select
                          value={applicationType}
                          onChange={(e) => setApplicationType(e.target.value)}
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="residential">Residential</option>
                          <option value="commercial">Commercial & Industrial</option>
                          <option value="utility">Utility Scale</option>
                          <option value="microgrid">Microgrid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Primary Use Case
                        </label>
                        <select
                          value={useCase}
                          onChange={(e) => setUseCase(e.target.value)}
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g., Downtown Hotel BESS"
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, State"
                          className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
                        <DollarSign className="w-5 h-5" style={{ color: '#fbbf24' }} />
                      </div>
                      Financial Parameters
                      <span className="text-xs font-normal ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Rates & costs for ROI calculation
                      </span>
                    </h3>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          Utility Rate
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'rgba(251,191,36,0.6)' }}>$</span>
                          <input
                            type="number"
                            value={utilityRate}
                            onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            className="w-full pl-7 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>/kWh</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          Demand Charge
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'rgba(251,191,36,0.6)' }}>$</span>
                          <input
                            type="number"
                            value={demandCharge}
                            onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>/kW</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          Cycles / Year
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={cyclesPerYear}
                            onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                            className="w-full px-3 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>cyc/yr</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          Warranty
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={warrantyYears}
                            onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 10)}
                            className="w-full px-3 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>years</span>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Financials Link */}
                    <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Landmark className="w-5 h-5" style={{ color: '#fbbf24' }} />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Need Bank-Ready Financials?
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              3-Statement Model, DSCR, IRR, MACRS, Revenue Stacking
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewMode("professional-model")}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
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
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <Zap className="w-5 h-5 text-violet-400" />
                      </div>
                      Electrical Specifications
                      <span className="text-xs font-normal ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        PCS, Inverters, Transformers
                      </span>
                    </h3>
                  </div>

                  <div className="p-6">
                    {/* Power Conversion System (PCS) Configuration */}
                    <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-violet-400" />
                        Power Conversion System (PCS)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PCS Quoting Option */}
                        <div className="col-span-full">
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            PCS Quoting Method
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1" style={{ background: !pcsQuoteSeparately ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', border: !pcsQuoteSeparately ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                              <input
                                type="radio"
                                checked={!pcsQuoteSeparately}
                                onChange={() => setPcsQuoteSeparately(false)}
                                className="w-5 h-5 text-violet-500"
                              />
                              <span className="text-sm font-semibold text-white">
                                Included with BESS System
                              </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1" style={{ background: pcsQuoteSeparately ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', border: pcsQuoteSeparately ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                              <input
                                type="radio"
                                checked={pcsQuoteSeparately}
                                onChange={() => setPcsQuoteSeparately(true)}
                                className="w-5 h-5 text-violet-500"
                              />
                              <span className="text-sm font-semibold text-white">Quote PCS Separately</span>
                            </label>
                          </div>
                          {pcsQuoteSeparately && (
                            <p className="text-sm mt-3 rounded-lg p-3" style={{ color: 'rgba(139,92,246,0.9)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              💡 PCS will be itemized separately in the quote with detailed
                              specifications
                            </p>
                          )}
                        </div>

                        {/* Inverter Type */}
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Inverter Type
                          </label>
                          <select
                            value={inverterType}
                            onChange={(e) => setInverterType(e.target.value)}
                            className="w-full px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none transition-colors"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            <option value="bidirectional">Bidirectional Inverter</option>
                            <option value="unidirectional">Unidirectional (Charge Only)</option>
                          </select>
                          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {inverterType === "bidirectional"
                              ? "⚡ Supports charge & discharge"
                              : "⚡ Charge only (typical for solar)"}
                          </p>
                        </div>

                        {/* Number of Inverters */}
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
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
                              className="flex-1 px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                              placeholder="Auto-calculated"
                            />
                            <button
                              onClick={() =>
                                setNumberOfInvertersInput(Math.ceil(totalKW / inverterRating))
                              }
                              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 border-2 border-purple-700 rounded-lg text-sm font-bold text-white transition-all shadow-sm"
                              title="Auto-calculate based on system size"
                            >
                              Auto
                            </button>
                          </div>
                          <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Suggested: {Math.ceil(totalKW / inverterRating)} units @{" "}
                            {inverterRating} kW each
                          </p>
                        </div>

                        {/* Inverter Rating */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Inverter Rating (kW per unit)
                          </label>
                          <input
                            type="number"
                            value={inverterRating}
                            onChange={(e) => setInverterRating(parseFloat(e.target.value) || 2500)}
                            step="100"
                            min="100"
                            className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>

                        {/* Manufacturer */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Inverter Manufacturer (Optional)
                          </label>
                          <input
                            type="text"
                            value={inverterManufacturer}
                            onChange={(e) => setInverterManufacturer(e.target.value)}
                            placeholder="e.g., SMA, Sungrow, Power Electronics"
                            className="w-full px-4 py-3 rounded-lg text-white text-base placeholder-white/30 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Electrical Parameters - INPUT FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* System Watts */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <label className="block text-xs mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
                          className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <p className="text-xs text-violet-400 mt-2 font-bold">
                          {totalKW.toLocaleString()} kW / {(totalKW / 1000).toFixed(2)} MW
                        </p>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Calculated: {calculatedWatts.toLocaleString()} W
                        </p>
                      </div>

                      {/* AC Amps */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <label className="block text-xs mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <p className="text-xs text-indigo-400 mt-2 font-bold">
                          @ {systemVoltage}V AC Per Phase
                        </p>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Calculated: {calculatedAmpsAC.toFixed(0)} A
                        </p>
                      </div>

                      {/* DC Amps */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <label className="block text-xs mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <p className="text-xs text-blue-400 mt-2 font-bold">@ {dcVoltage}V DC</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Calculated: {calculatedAmpsDC.toFixed(0)} A
                        </p>
                      </div>
                    </div>

                    {/* Voltage Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="rounded-lg p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          AC System Voltage (V)
                        </label>
                        <select
                          value={systemVoltage}
                          onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value={208}>208V (Small Commercial)</option>
                          <option value={480}>480V (Standard Industrial)</option>
                          <option value={600}>600V (Large Industrial)</option>
                          <option value={4160}>4.16 kV (Medium Voltage)</option>
                          <option value={13800}>13.8 kV (Utility Scale)</option>
                        </select>
                      </div>

                      <div className="rounded-lg p-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          DC Battery Voltage (V)
                        </label>
                        <input
                          type="number"
                          value={dcVoltage}
                          onChange={(e) => setDcVoltage(parseInt(e.target.value) || 1000)}
                          step="100"
                          min="100"
                          className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Typical: 800V - 1500V DC
                        </p>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 className="text-sm font-bold text-violet-400 mb-4 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-violet-400" />
                        System Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Power:</p>
                          <p className="text-xl font-bold text-white">
                            {(totalKW / 1000).toFixed(2)} MW
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Inverters:</p>
                          <p className="text-xl font-bold text-white">
                            {numberOfInverters} units
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>AC Current:</p>
                          <p className="text-xl font-bold text-indigo-400">
                            {maxAmpsAC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>DC Current:</p>
                          <p className="text-xl font-bold text-blue-400">
                            {maxAmpsDC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
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

                    <div className="mt-4 rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        ⚡ <strong className="text-white">Note:</strong> Input custom values to override calculated
                        specifications. Leave blank to use auto-calculated values based on{" "}
                        {storageSizeMW} MW system rating.
                        {pcsQuoteSeparately &&
                          " PCS will be itemized with detailed manufacturer specifications."}
                      </p>
                    </div>
                  </div>

                  {/* Renewables & Alternative Power Section */}
                  <div
                    data-section="renewables"
                    className="rounded-xl p-8 scroll-mt-24"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <span className="text-white">
                          Renewables & Alternative Power
                        </span>
                      </h3>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Include Renewables
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={includeRenewables}
                            onChange={(e) => setIncludeRenewables(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                        </div>
                      </label>
                    </div>

                    {includeRenewables && (
                      <div className="space-y-6">
                        {/* Solar PV */}
                        <div className="rounded-xl p-6" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-base font-semibold flex items-center gap-2 text-white">
                              ☀️ Solar PV System
                            </h4>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={solarPVIncluded}
                                onChange={(e) => setSolarPVIncluded(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-white/20 text-amber-500 focus:ring-amber-500/40 bg-transparent"
                              />
                              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                Include Solar
                              </span>
                            </label>
                          </div>

                          {solarPVIncluded &&
                            (() => {
                              const solarSizing = calculateSolarSizing({
                                solarCapacityKW,
                                panelType: solarPanelType,
                                panelEfficiency: solarPanelEfficiency,
                                region: "midwest", // TODO: make region user-selectable if needed
                              });
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Solar Capacity (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={solarCapacityKW}
                                      onChange={(e) =>
                                        setSolarCapacityKW(parseFloat(e.target.value) || 0)
                                      }
                                      step="50"
                                      min="0"
                                      className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Panel Type
                                    </label>
                                    <select
                                      value={solarPanelType}
                                      onChange={(e) => setSolarPanelType(e.target.value)}
                                      className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                      <option value="monocrystalline">
                                        Monocrystalline (20-22% eff.)
                                      </option>
                                      <option value="polycrystalline">
                                        Polycrystalline (15-17% eff.)
                                      </option>
                                      <option value="thin-film">Thin-Film (10-12% eff.)</option>
                                      <option value="bifacial">Bifacial (22-24% eff.)</option>
                                      <option value="perc">PERC (21-23% eff.)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Panel Efficiency (%)
                                    </label>
                                    <input
                                      type="number"
                                      value={solarPanelEfficiency}
                                      onChange={(e) =>
                                        setSolarPanelEfficiency(parseFloat(e.target.value) || 15)
                                      }
                                      min="10"
                                      max="25"
                                      step="0.5"
                                      className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Solar Inverter Type
                                    </label>
                                    <select
                                      value={solarInverterType}
                                      onChange={(e) => setSolarInverterType(e.target.value)}
                                      className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                      <option value="string">String Inverter</option>
                                      <option value="micro">Micro-Inverters</option>
                                      <option value="power-optimizer">Power Optimizers</option>
                                      <option value="central">Central Inverter</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2 rounded-xl p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                    <p className="text-sm text-amber-300 font-bold mb-2">
                                      ☀️ Estimated Annual Production:{" "}
                                      <strong className="text-amber-200">
                                        {solarSizing.annualKWh.toLocaleString()} kWh/year
                                      </strong>{" "}
                                      ({solarSizing.sunHours} hrs/year avg)
                                    </p>
                                    <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                      Array Size: ~{solarSizing.arrayAreaSqFt.toLocaleString()} sq
                                      ft (~{solarSizing.arrayAreaAcres} acres) | ~
                                      {solarSizing.panelsNeeded} panels @ {solarSizing.panelWattage}
                                      W
                                    </p>
                                    <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                      ILR: {solarSizing.ilr} (DC-coupled, NREL ATB 2024)
                                    </p>
                                    <p className="text-xs mt-2 italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                      {solarSizing.citation}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                        </div>

                        {/* Wind Turbine */}
                        <div className="rounded-xl p-6" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-semibold flex items-center gap-2 text-white">
                              💨 Wind Turbine System
                            </h4>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={windTurbineIncluded}
                                onChange={(e) => setWindTurbineIncluded(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 text-cyan-500 focus:ring-cyan-500/40 bg-transparent"
                              />
                              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                Include Wind
                              </span>
                            </label>
                          </div>

                          {windTurbineIncluded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Wind Capacity (kW)
                                </label>
                                <input
                                  type="number"
                                  value={windCapacityKW}
                                  onChange={(e) =>
                                    setWindCapacityKW(parseFloat(e.target.value) || 0)
                                  }
                                  step="50"
                                  min="0"
                                  className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Turbine Type
                                </label>
                                <select
                                  value={windTurbineType}
                                  onChange={(e) => setWindTurbineType(e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                  <option value="horizontal">Horizontal Axis (HAWT)</option>
                                  <option value="vertical">Vertical Axis (VAWT)</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 rounded p-3" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
                                <p className="text-sm text-cyan-300 font-bold">
                                  💨 Estimated Annual Production:{" "}
                                  <strong className="text-cyan-200">
                                    {(windCapacityKW * 2200).toLocaleString()} kWh/year
                                  </strong>{" "}
                                  (25% capacity factor)
                                </p>
                                <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  Requires: Average wind speed of 5+ m/s | Tower height: 80-120m for
                                  utility scale
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Fuel Cell */}
                        <div className="rounded-xl p-6" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-semibold flex items-center gap-2 text-white">
                              <Cpu className="w-5 h-5 text-blue-400" />
                              Fuel Cell System
                            </h4>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fuelCellIncluded}
                                onChange={(e) => setFuelCellIncluded(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 text-blue-500 focus:ring-blue-500/40 bg-transparent"
                              />
                              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                Include Fuel Cell
                              </span>
                            </label>
                          </div>

                          {fuelCellIncluded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Fuel Cell Capacity (kW)
                                </label>
                                <input
                                  type="number"
                                  value={fuelCellCapacityKW}
                                  onChange={(e) =>
                                    setFuelCellCapacityKW(parseFloat(e.target.value) || 0)
                                  }
                                  step="25"
                                  min="0"
                                  className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Fuel Cell Type
                                </label>
                                <select
                                  value={fuelCellType}
                                  onChange={(e) => setFuelCellType(e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                  <option value="pem">PEM (Proton Exchange Membrane)</option>
                                  <option value="sofc">SOFC (Solid Oxide)</option>
                                  <option value="mcfc">MCFC (Molten Carbonate)</option>
                                  <option value="pafc">PAFC (Phosphoric Acid)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Fuel Type
                                </label>
                                <select
                                  value={fuelType}
                                  onChange={(e) => setFuelType(e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                  <option value="hydrogen">Hydrogen (H₂)</option>
                                  <option value="natural-gas">Natural Gas</option>
                                  <option value="biogas">Biogas</option>
                                  <option value="methanol">Methanol</option>
                                </select>
                              </div>
                              <div className="rounded p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                <p className="text-sm text-blue-300 font-bold">
                                  ⚡ Efficiency: <strong className="text-blue-200">45-60%</strong>
                                </p>
                                <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  Clean, quiet, continuous power
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Backup Generators */}
                        <div className="rounded-xl p-6" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
                          <h4 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
                            <GitBranch className="w-5 h-5 text-orange-400" />
                            Backup Generators
                          </h4>

                          <div className="space-y-4">
                            {/* Diesel Generator */}
                            <div className="rounded-lg p-4" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold flex items-center gap-2 text-white">
                                  🛢️ Diesel Generator
                                </h5>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={dieselGenIncluded}
                                    onChange={(e) => setDieselGenIncluded(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 text-orange-500 focus:ring-orange-500/40 bg-transparent"
                                  />
                                  <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Include
                                  </span>
                                </label>
                              </div>
                              {dieselGenIncluded && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Capacity (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={dieselGenCapacityKW}
                                      onChange={(e) =>
                                        setDieselGenCapacityKW(parseFloat(e.target.value) || 0)
                                      }
                                      step="50"
                                      min="0"
                                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                      Fuel: ~0.3 gal/kWh
                                      <br />
                                      Runtime: 8-24 hrs @ 50% load
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Natural Gas Generator */}
                            <div className="rounded-lg p-4" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold flex items-center gap-2 text-white">
                                  🔥 Natural Gas Generator
                                </h5>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={naturalGasGenIncluded}
                                    onChange={(e) => setNaturalGasGenIncluded(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 text-orange-500 focus:ring-orange-500/40 bg-transparent"
                                  />
                                  <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Include
                                  </span>
                                </label>
                              </div>
                              {naturalGasGenIncluded && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Capacity (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={naturalGasCapacityKW}
                                      onChange={(e) =>
                                        setNaturalGasCapacityKW(parseFloat(e.target.value) || 0)
                                      }
                                      step="50"
                                      min="0"
                                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/40 focus:outline-none"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                      Cleaner than diesel
                                      <br />
                                      Continuous runtime w/ utility gas
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 rounded p-3" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.1)' }}>
                            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              💡 <strong className="text-white">Note:</strong> Generators provide backup power but have
                              emissions. Best used with BESS for short-duration peaks.
                            </p>
                          </div>
                        </div>

                        {/* Renewables Summary */}
                        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <h4 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            Combined Renewables Summary
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                              <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                Total Renewable
                              </p>
                              <p className="text-2xl font-bold text-emerald-400">
                                {(
                                  (solarPVIncluded ? solarCapacityKW : 0) +
                                  (windTurbineIncluded ? windCapacityKW : 0) +
                                  (fuelCellIncluded ? fuelCellCapacityKW : 0)
                                ).toFixed(0)}{" "}
                                kW
                              </p>
                            </div>
                            <div className="rounded p-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                              <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Backup Gen</p>
                              <p className="text-2xl font-bold text-orange-400">
                                {(
                                  (dieselGenIncluded ? dieselGenCapacityKW : 0) +
                                  (naturalGasGenIncluded ? naturalGasCapacityKW : 0)
                                ).toFixed(0)}{" "}
                                kW
                              </p>
                            </div>
                            <div className="rounded p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                              <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                BESS + Renewable
                              </p>
                              <p className="text-2xl font-bold text-blue-400">
                                {(
                                  totalKW +
                                  (solarPVIncluded ? solarCapacityKW : 0) +
                                  (windTurbineIncluded ? windCapacityKW : 0)
                                ).toFixed(0)}{" "}
                                kW
                              </p>
                            </div>
                            <div className="rounded p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                              <p className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                Total Capacity
                              </p>
                              <p className="text-2xl font-bold text-violet-400">
                                {(
                                  totalKW +
                                  (solarPVIncluded ? solarCapacityKW : 0) +
                                  (windTurbineIncluded ? windCapacityKW : 0) +
                                  (fuelCellIncluded ? fuelCellCapacityKW : 0) +
                                  (dieselGenIncluded ? dieselGenCapacityKW : 0) +
                                  (naturalGasGenIncluded ? naturalGasCapacityKW : 0)
                                ).toFixed(0)}{" "}
                                kW
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!includeRenewables && (
                      <div className="text-center py-8">
                        <p className="text-lg text-white/70 font-semibold">
                          Enable renewables to configure solar, wind, fuel cells, and backup
                          generators
                        </p>
                        <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Hybrid systems can reduce costs and improve resiliency
                        </p>
                      </div>
                    )}
                  </div>

                  {/* System Summary */}
                  <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                      📊 System Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <p className="text-sm mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>System Rating</p>
                        <p className="text-3xl font-bold text-blue-400">
                          {storageSizeMW.toFixed(1)} MW
                        </p>
                        <p className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {storageSizeMWh.toFixed(1)} MWh
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <p className="text-sm mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Cost</p>
                        <p className="text-3xl font-bold text-emerald-400">
                          ${(localSystemCost / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <p className="text-sm mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Application</p>
                        <p className="text-xl font-bold text-violet-400 capitalize">
                          {applicationType}
                        </p>
                        <p className="text-sm font-bold capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                        const configData = {
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
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                    >
                      Generate Detailed Quote →
                    </button>
                  </div>
                </div>

                {/* Help Section */}
                <div className="mt-8 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    💡 Configuration Guidelines
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-white mb-1">Power & Duration:</p>
                      <ul className="space-y-1 ml-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <li>• Peak shaving: 0.5-2 MW, 2-4 hrs</li>
                        <li>• Backup power: 0.5-5 MW, 4-8 hrs</li>
                        <li>• Utility scale: 10-100 MW, 2-4 hrs</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Battery Chemistry:</p>
                      <ul className="space-y-1 ml-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <li>• LFP: Best for daily cycling, safest</li>
                        <li>• NMC: Higher energy density, premium cost</li>
                        <li>• LTO: 20,000+ cycles, fastest charge</li>
                      </ul>
                    </div>
                  </div>
                </div>
                </div>
                {/* END LEFT COLUMN */}

                {/* RIGHT COLUMN: Running Calculator (sticky) */}
                <div className="hidden xl:block w-[320px] flex-shrink-0">
                  <div className="sticky top-[120px]" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    <div
                      className="rounded-xl overflow-hidden flex flex-col"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        maxHeight: 'calc(100vh - 160px)',
                      }}
                    >
                      <ProQuoteRunningCalculator
                        storageSizeMW={storageSizeMW}
                        durationHours={durationHours}
                        solarIncluded={solarPVIncluded}
                        solarCapacityKW={solarCapacityKW}
                        windIncluded={windTurbineIncluded}
                        windCapacityKW={windCapacityKW}
                        fuelCellIncluded={fuelCellIncluded}
                        fuelCellCapacityKW={fuelCellCapacityKW}
                        dieselGenIncluded={dieselGenIncluded}
                        dieselGenCapacityKW={dieselGenCapacityKW}
                        naturalGasGenIncluded={naturalGasGenIncluded}
                        naturalGasCapacityKW={naturalGasCapacityKW}
                        utilityRate={utilityRate}
                        demandCharge={demandCharge}
                        chemistry={chemistry}
                        useCase={useCase}
                        totalKW={totalKW}
                        maxAmpsAC={maxAmpsAC}
                        maxAmpsDC={maxAmpsDC}
                        systemVoltage={systemVoltage}
                        dcVoltage={dcVoltage}
                        numberOfInverters={numberOfInverters}
                        inverterRating={inverterRating}
                        financialMetrics={financialMetrics}
                        isCalculating={isCalculating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ MOBILE CALCULATOR TOGGLE (below xl breakpoint) ═══ */}
            <button
              onClick={() => setShowMobileCalc(true)}
              className="xl:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', backdropFilter: 'blur(12px)' }}
            >
              <Calculator className="w-4 h-4" />
              Calculator
              {financialMetrics && (
                <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                  ${((financialMetrics.totalProjectCost ?? 0) / 1_000_000).toFixed(1)}M
                </span>
              )}
            </button>

            {/* ═══ MOBILE CALCULATOR DRAWER ═══ */}
            {showMobileCalc && (
              <div className="xl:hidden fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileCalc(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-[340px] max-w-[90vw] overflow-y-auto" style={{ background: '#0f1117', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-sm font-bold text-white">Running Calculator</span>
                    <button
                      onClick={() => setShowMobileCalc(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                  <ProQuoteRunningCalculator
                    storageSizeMW={storageSizeMW}
                    durationHours={durationHours}
                    solarIncluded={solarPVIncluded}
                    solarCapacityKW={solarCapacityKW}
                    windIncluded={windTurbineIncluded}
                    windCapacityKW={windCapacityKW}
                    fuelCellIncluded={fuelCellIncluded}
                    fuelCellCapacityKW={fuelCellCapacityKW}
                    dieselGenIncluded={dieselGenIncluded}
                    dieselGenCapacityKW={dieselGenCapacityKW}
                    naturalGasGenIncluded={naturalGasGenIncluded}
                    naturalGasCapacityKW={naturalGasCapacityKW}
                    utilityRate={utilityRate}
                    demandCharge={demandCharge}
                    chemistry={chemistry}
                    useCase={useCase}
                    totalKW={totalKW}
                    maxAmpsAC={maxAmpsAC}
                    maxAmpsDC={maxAmpsDC}
                    systemVoltage={systemVoltage}
                    dcVoltage={dcVoltage}
                    numberOfInverters={numberOfInverters}
                    inverterRating={inverterRating}
                    financialMetrics={financialMetrics}
                    isCalculating={isCalculating}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote Preview Modal */}
        {showQuotePreview && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Modal Header */}
              <div className="text-white p-6 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Eye className="w-7 h-7 text-blue-400" />
                    Quote Format Preview
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>See how your professional quote will look</p>
                </div>
                <button
                  onClick={() => setShowQuotePreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Format Tabs */}
                <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setPreviewFormat("word")}
                    className={`px-6 py-3 font-semibold transition-colors ${
                      previewFormat === "word"
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    📄 Word Document
                  </button>
                  <button
                    onClick={() => setPreviewFormat("excel")}
                    className={`px-6 py-3 font-semibold transition-colors ${
                      previewFormat === "excel"
                        ? "text-emerald-400 border-b-2 border-emerald-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    📊 Excel Spreadsheet
                  </button>
                </div>

                {/* Word Document Preview */}
                {previewFormat === "word" && (
                  <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div
                      className="bg-white rounded-lg p-8 shadow-lg max-w-4xl mx-auto"
                      style={{ fontFamily: "Calibri, sans-serif" }}
                    >
                      {/* Document Header */}
                      <div className="border-b-4 border-blue-600 pb-6 mb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                              ⚡ MERLIN Energy
                            </h1>
                            <p className="text-lg text-gray-600">
                              Battery Energy Storage System Quote
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p className="font-semibold">
                              Quote #MER-{Math.floor(Math.random() * 10000)}
                            </p>
                            <p>{new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Project Information */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                          Project Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-semibold text-gray-700">Project Name:</p>
                            <p className="text-gray-900">{projectName || "Sample BESS Project"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Location:</p>
                            <p className="text-gray-900">{location || "California, USA"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Application Type:</p>
                            <p className="text-gray-900 capitalize">{applicationType}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Use Case:</p>
                            <p className="text-gray-900 capitalize">{useCase.replace("-", " ")}</p>
                          </div>
                        </div>
                      </div>

                      {/* System Specifications */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                          System Specifications
                        </h2>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Power Rating:</td>
                              <td className="py-2 text-gray-900 text-right">
                                {storageSizeMW.toFixed(1)} MW
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Energy Capacity:</td>
                              <td className="py-2 text-gray-900 text-right">
                                {storageSizeMWh.toFixed(1)} MWh
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Duration:</td>
                              <td className="py-2 text-gray-900 text-right">
                                {durationHours.toFixed(1)} hours
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Battery Chemistry:
                              </td>
                              <td className="py-2 text-gray-900 text-right uppercase">
                                {chemistry}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Round-Trip Efficiency:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {roundTripEfficiency}%
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Installation Type:
                              </td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {installationType}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Grid Connection:</td>
                              <td className="py-2 text-gray-900 text-right uppercase">
                                {gridConnection}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Electrical Specifications */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                          Electrical Specifications
                        </h2>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                System Voltage (AC):
                              </td>
                              <td className="py-2 text-gray-900 text-right">{systemVoltage}V</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">DC Voltage:</td>
                              <td className="py-2 text-gray-900 text-right">{dcVoltage}V</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Inverter Type:</td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {inverterType}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Number of Inverters:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {numberOfInverters} units
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Inverter Rating (each):
                              </td>
                              <td className="py-2 text-gray-900 text-right">{inverterRating} kW</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Total Inverter Capacity:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {numberOfInverters * inverterRating} kW
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Inverter Efficiency:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {inverterEfficiency}%
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Switchgear Type:</td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {switchgearType.replace("-", " ")}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Switchgear Rating:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {switchgearRating} A
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">BMS Type:</td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {bmsType}
                              </td>
                            </tr>
                            {transformerRequired && (
                              <>
                                <tr className="border-b border-gray-200">
                                  <td className="py-2 font-semibold text-gray-700">
                                    Transformer Rating:
                                  </td>
                                  <td className="py-2 text-gray-900 text-right">
                                    {transformerRating} kVA
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                  <td className="py-2 font-semibold text-gray-700">
                                    Transformer Voltage:
                                  </td>
                                  <td className="py-2 text-gray-900 text-right">
                                    {transformerVoltage}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Performance Metrics */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                          Performance & Operations
                        </h2>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Expected Cycles per Year:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {cyclesPerYear} cycles
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Warranty Period:</td>
                              <td className="py-2 text-gray-900 text-right">
                                {warrantyYears} years
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Reference Utility Rate:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                ${utilityRate.toFixed(3)}/kWh
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">
                                Reference Demand Charge:
                              </td>
                              <td className="py-2 text-gray-900 text-right">${demandCharge}/kW</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Renewable Integration (if applicable) */}
                      {(solarPVIncluded ||
                        windTurbineIncluded ||
                        fuelCellIncluded ||
                        dieselGenIncluded ||
                        naturalGasGenIncluded) && (
                        <div className="mb-6">
                          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                            Renewable & Backup Integration
                          </h2>
                          <table className="w-full text-sm">
                            <tbody>
                              {solarPVIncluded && (
                                <>
                                  <tr className="border-b border-gray-200 bg-yellow-50">
                                    <td className="py-2 font-semibold text-gray-700">
                                      ☀️ Solar PV Capacity:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right">
                                      {solarCapacityKW} kW
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="py-2 font-semibold text-gray-700 pl-6">
                                      Panel Type:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right capitalize">
                                      {solarPanelType}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="py-2 font-semibold text-gray-700 pl-6">
                                      Panel Efficiency:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right">
                                      {solarPanelEfficiency}%
                                    </td>
                                  </tr>
                                </>
                              )}
                              {windTurbineIncluded && (
                                <>
                                  <tr className="border-b border-gray-200 bg-blue-50">
                                    <td className="py-2 font-semibold text-gray-700">
                                      💨 Wind Turbine Capacity:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right">
                                      {windCapacityKW} kW
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="py-2 font-semibold text-gray-700 pl-6">
                                      Turbine Type:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right capitalize">
                                      {windTurbineType}
                                    </td>
                                  </tr>
                                </>
                              )}
                              {fuelCellIncluded && (
                                <>
                                  <tr className="border-b border-gray-200 bg-green-50">
                                    <td className="py-2 font-semibold text-gray-700">
                                      ⚗️ Fuel Cell Capacity:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right">
                                      {fuelCellCapacityKW} kW
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="py-2 font-semibold text-gray-700 pl-6">
                                      Fuel Cell Type:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right uppercase">
                                      {fuelCellType}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <td className="py-2 font-semibold text-gray-700 pl-6">
                                      Fuel Type:
                                    </td>
                                    <td className="py-2 text-gray-900 text-right capitalize">
                                      {fuelType}
                                    </td>
                                  </tr>
                                </>
                              )}
                              {dieselGenIncluded && (
                                <tr className="border-b border-gray-200 bg-orange-50">
                                  <td className="py-2 font-semibold text-gray-700">
                                    🔧 Diesel Generator Capacity:
                                  </td>
                                  <td className="py-2 text-gray-900 text-right">
                                    {dieselGenCapacityKW} kW
                                  </td>
                                </tr>
                              )}
                              {naturalGasGenIncluded && (
                                <tr className="border-b border-gray-200 bg-purple-50">
                                  <td className="py-2 font-semibold text-gray-700">
                                    🔥 Natural Gas Generator:
                                  </td>
                                  <td className="py-2 text-gray-900 text-right">
                                    {naturalGasCapacityKW} kW
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pricing Summary */}
                      <div className="mb-6 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Investment Summary
                        </h2>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-gray-700">Total System Cost:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              ${(localSystemCost / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Cost per kW:</span>
                            <span className="font-semibold">
                              ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Cost per kWh:</span>
                            <span className="font-semibold">
                              ${(localSystemCost / (storageSizeMWh * 1000)).toFixed(0)}/kWh
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-8 pt-6 border-t-2 border-gray-300 text-xs text-gray-600">
                        <p className="mb-2">
                          This quote is valid for 30 days from the date of issue.
                        </p>
                        <p className="mb-2">
                          Terms: 50% deposit upon contract signing, 50% upon commissioning.
                        </p>
                        <p>Warranty: {warrantyYears} year comprehensive warranty included.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Excel Spreadsheet Preview */}
                {previewFormat === "excel" && (
                  <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="bg-white rounded-lg p-4 shadow-lg max-w-5xl mx-auto overflow-x-auto">
                      {/* Excel-style spreadsheet */}
                      <div className="text-xs" style={{ fontFamily: "Arial, sans-serif" }}>
                        {/* Header Row */}
                        <div className="bg-green-700 text-white font-bold grid grid-cols-12 border border-gray-400">
                          <div className="p-2 border-r border-gray-400">A</div>
                          <div className="p-2 border-r border-gray-400">B</div>
                          <div className="p-2 border-r border-gray-400">C</div>
                          <div className="p-2 border-r border-gray-400">D</div>
                          <div className="p-2 border-r border-gray-400">E</div>
                          <div className="p-2 border-r border-gray-400">F</div>
                          <div className="p-2 border-r border-gray-400">G</div>
                          <div className="p-2 border-r border-gray-400">H</div>
                          <div className="p-2 border-r border-gray-400">I</div>
                          <div className="p-2 border-r border-gray-400">J</div>
                          <div className="p-2 border-r border-gray-400">K</div>
                          <div className="p-2">L</div>
                        </div>

                        {/* Title Section */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-blue-600 text-white font-bold text-xl p-3 border-b border-gray-400">
                            ⚡ MERLIN Energy - BESS Quote Summary
                          </div>
                        </div>

                        {/* Quote Info */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Quote #
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400">
                            MER-{Math.floor(Math.random() * 10000)}
                          </div>
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Date
                          </div>
                          <div className="col-span-3 p-2">{new Date().toLocaleDateString()}</div>
                        </div>

                        {/* Empty Row */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 p-2">&nbsp;</div>
                        </div>

                        {/* Project Information Header */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-blue-100 font-bold p-2">
                            PROJECT INFORMATION
                          </div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Project Name
                          </div>
                          <div className="col-span-9 p-2">
                            {projectName || "Sample BESS Project"}
                          </div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Location
                          </div>
                          <div className="col-span-9 p-2">{location || "California, USA"}</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Application
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 capitalize">
                            {applicationType}
                          </div>
                          <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                            Use Case
                          </div>
                          <div className="col-span-3 p-2 capitalize">
                            {useCase.replace("-", " ")}
                          </div>
                        </div>

                        {/* Empty Row */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 p-2">&nbsp;</div>
                        </div>

                        {/* System Specifications */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-blue-100 font-bold p-2">
                            SYSTEM SPECIFICATIONS
                          </div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-gray-50">
                          <div className="col-span-6 font-semibold p-2 border-r border-gray-400">
                            Parameter
                          </div>
                          <div className="col-span-3 font-semibold p-2 border-r border-gray-400 text-center">
                            Value
                          </div>
                          <div className="col-span-3 font-semibold p-2 text-center">Unit</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Power Rating
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {storageSizeMW.toFixed(1)}
                          </div>
                          <div className="col-span-3 p-2 text-center">MW</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Energy Capacity
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {storageSizeMWh.toFixed(1)}
                          </div>
                          <div className="col-span-3 p-2 text-center">MWh</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">Duration</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {durationHours.toFixed(1)}
                          </div>
                          <div className="col-span-3 p-2 text-center">hours</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Battery Chemistry
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">
                            {chemistry}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Round-Trip Efficiency
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {roundTripEfficiency}
                          </div>
                          <div className="col-span-3 p-2 text-center">%</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Cycles per Year
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {cyclesPerYear}
                          </div>
                          <div className="col-span-3 p-2 text-center">cycles/yr</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Installation Type
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                            {installationType}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Grid Connection
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">
                            {gridConnection}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>

                        {/* Empty Row */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 p-2">&nbsp;</div>
                        </div>

                        {/* Electrical Specifications */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-blue-100 font-bold p-2">
                            ELECTRICAL SPECIFICATIONS
                          </div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            System Voltage (AC)
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {systemVoltage}
                          </div>
                          <div className="col-span-3 p-2 text-center">V</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">DC Voltage</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {dcVoltage}
                          </div>
                          <div className="col-span-3 p-2 text-center">V</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Number of Inverters
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {numberOfInverters}
                          </div>
                          <div className="col-span-3 p-2 text-center">units</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Inverter Rating (each)
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {inverterRating}
                          </div>
                          <div className="col-span-3 p-2 text-center">kW</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Inverter Efficiency
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {inverterEfficiency}
                          </div>
                          <div className="col-span-3 p-2 text-center">%</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Inverter Type
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                            {inverterType}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Switchgear Type
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                            {switchgearType.replace("-", " ")}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Switchgear Rating
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {switchgearRating}
                          </div>
                          <div className="col-span-3 p-2 text-center">A</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">BMS Type</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                            {bmsType}
                          </div>
                          <div className="col-span-3 p-2 text-center">-</div>
                        </div>
                        {transformerRequired && (
                          <>
                            <div className="grid grid-cols-12 border-x border-b border-gray-400">
                              <div className="col-span-6 p-2 border-r border-gray-400">
                                Transformer Rating
                              </div>
                              <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                                {transformerRating}
                              </div>
                              <div className="col-span-3 p-2 text-center">kVA</div>
                            </div>
                            <div className="grid grid-cols-12 border-x border-b border-gray-400">
                              <div className="col-span-6 p-2 border-r border-gray-400">
                                Transformer Voltage
                              </div>
                              <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                                {transformerVoltage}
                              </div>
                              <div className="col-span-3 p-2 text-center">-</div>
                            </div>
                          </>
                        )}

                        {/* Empty Row */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 p-2">&nbsp;</div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-green-100 font-bold p-2">
                            FINANCIAL SUMMARY
                          </div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-yellow-50">
                          <div className="col-span-6 font-bold p-2 border-r border-gray-400">
                            Total System Cost
                          </div>
                          <div className="col-span-3 font-bold p-2 border-r border-gray-400 text-right text-green-700">
                            ${(localSystemCost / 1000000).toFixed(2)}M
                          </div>
                          <div className="col-span-3 p-2 text-center">USD</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">Cost per kW</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}
                          </div>
                          <div className="col-span-3 p-2 text-center">$/kW</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Cost per kWh
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            ${(localSystemCost / (storageSizeMWh * 1000)).toFixed(0)}
                          </div>
                          <div className="col-span-3 p-2 text-center">$/kWh</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Warranty Period
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            {warrantyYears}
                          </div>
                          <div className="col-span-3 p-2 text-center">years</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Utility Rate (Reference)
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            ${utilityRate.toFixed(3)}
                          </div>
                          <div className="col-span-3 p-2 text-center">$/kWh</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">
                            Demand Charge (Reference)
                          </div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                            ${demandCharge}
                          </div>
                          <div className="col-span-3 p-2 text-center">$/kW</div>
                        </div>

                        {/* Footer */}
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 p-2">&nbsp;</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-12 bg-gray-100 text-xs p-3">
                            <p className="mb-1">
                              <strong>Quote Valid:</strong> 30 days from issue date
                            </p>
                            <p className="mb-1">
                              <strong>Payment Terms:</strong> 50% deposit upon contract signing, 50%
                              upon commissioning
                            </p>
                            <p>
                              <strong>Includes:</strong> {warrantyYears}-year comprehensive
                              warranty, installation, commissioning, and training
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4 justify-end">
                  <button
                    onClick={() => setShowQuotePreview(false)}
                    className="px-6 py-3 rounded-lg font-semibold transition-colors" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    Close Preview
                  </button>

                  {/* Export Format Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportQuote("word")}
                      disabled={isExporting}
                      className="px-5 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02]" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Exporting...
                        </>
                      ) : exportSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Downloaded!
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Word (.docx)
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleExportQuote("excel")}
                      className="px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-[1.02]" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExportQuote("pdf")}
                      className="px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-[1.02]" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
                    >
                      <FileText className="w-5 h-5" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Dashboard View - DISABLED for V5 cleanup */}
        {viewMode === "interactive-dashboard" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#060d1f' }}>
            <div className="rounded-2xl p-8 max-w-md text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Interactive Dashboard</h2>
              <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                This feature is being upgraded to V5. Please use the Custom Configuration for now.
              </p>
              <button
                onClick={() => setViewMode("custom-config")}
                className="px-6 py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
              >
                Go to Custom Configuration
              </button>
            </div>
          </div>
        )}

        {/* Professional Financial Model View */}
        {viewMode === "professional-model" && (
          <div className="min-h-screen" style={{ background: '#0f1117' }}>
            {/* Header */}
            <div className="sticky top-0 z-10" style={{ background: 'rgba(15,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setViewMode("landing")}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <Landmark className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-white">
                        Bank-Ready Financial Model
                      </h1>
                      <p className="text-slate-500 text-xs">
                        Professional 3-Statement Pro-Forma for Investors
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Configuration Panel */}
              <div className="rounded-xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Model Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* System Size (from parent) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      System Size (MW)
                    </label>
                    <div className="rounded-lg px-4 py-3 text-white font-mono text-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {storageSizeMW.toFixed(2)} MW / {durationHours}h
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {/* SSOT: Unit conversion only (MW × hours × 1000 = kWh) - not pricing */}
                      {(storageSizeMW * durationHours * 1000).toLocaleString()} kWh total
                    </p>
                  </div>

                  {/* ISO Region */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      ISO Region
                    </label>
                    <select
                      value={selectedISORegion}
                      onChange={(e) =>
                        setSelectedISORegion(e.target.value as typeof selectedISORegion)
                      }
                      className="w-full rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="CAISO">CAISO (California)</option>
                      <option value="ERCOT">ERCOT (Texas)</option>
                      <option value="PJM">PJM (Mid-Atlantic)</option>
                      <option value="NYISO">NYISO (New York)</option>
                      <option value="ISO-NE">ISO-NE (New England)</option>
                      <option value="MISO">MISO (Midwest)</option>
                      <option value="SPP">SPP (Southwest)</option>
                    </select>
                  </div>

                  {/* Leverage */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Debt Ratio: {projectLeverage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={projectLeverage}
                      onChange={(e) => setProjectLeverage(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0% (All Equity)</span>
                      <span>80% (Leveraged)</span>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Interest Rate
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.25"
                        min="3"
                        max="15"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Example Output Preview - Shows users what to expect */}
                {!professionalModel && (
                  <div className="mt-6 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-slate-500" />
                      Example Output Preview
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Based on your {storageSizeMW.toFixed(2)} MW / {durationHours}h system, here's
                      an estimate of what your Bank-Ready Model will include:
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">Est. CapEx</p>
                        {/* SSOT: Using BESS_MARKET_RATE_2025 = $125/kWh from market data */}
                        <p className="text-lg font-bold text-white">
                          ${((storageSizeMW * durationHours * 1000 * 125) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">Est. Equity</p>
                        {/* SSOT: Equity = CapEx × (1 - leverage) */}
                        <p className="text-lg font-bold text-emerald-400">
                          $
                          {(
                            (storageSizeMW *
                              durationHours *
                              1000 *
                              125 *
                              (1 - projectLeverage / 100)) /
                            1000000
                          ).toFixed(1)}
                          M
                        </p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">Target IRR</p>
                        <p className="text-lg font-bold text-amber-400">12-18%</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">DSCR Target</p>
                        <p className="text-lg font-bold text-blue-400">≥1.25x</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">Payback</p>
                        <p className="text-lg font-bold text-slate-300">6-10 yrs</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500">Project Life</p>
                        <p className="text-lg font-bold text-slate-300">25 yrs</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white font-semibold text-sm mb-2">📊 3-Statement Model</p>
                        <ul className="text-slate-500 text-xs space-y-1">
                          <li>• Income Statement (25 years)</li>
                          <li>• Balance Sheet</li>
                          <li>• Cash Flow Statement</li>
                        </ul>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white font-semibold text-sm mb-2">💰 Revenue Stacking</p>
                        <ul className="text-slate-500 text-xs space-y-1">
                          <li>• Energy Arbitrage</li>
                          <li>• Frequency Regulation</li>
                          <li>• Capacity Payments</li>
                        </ul>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white font-semibold text-sm mb-2">🏦 Bank Metrics</p>
                        <ul className="text-slate-500 text-xs space-y-1">
                          <li>• DSCR Analysis</li>
                          <li>• Levered/Unlevered IRR</li>
                          <li>• MACRS Depreciation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={async () => {
                      setIsGeneratingModel(true);
                      try {
                        const result = await generateProfessionalModel({
                          storageSizeMW,
                          durationHours,
                          location: location || "California",
                          isoRegion: selectedISORegion,
                          debtEquityRatio: projectLeverage / 100,
                          interestRate: interestRate / 100,
                          loanTermYears,
                          electricityRate: utilityRate,
                          demandChargeRate: demandCharge,
                          revenueStreams: {
                            energyArbitrage: true,
                            demandChargeReduction: true,
                            frequencyRegulation: true,
                            spinningReserve: true,
                            capacityPayments: true,
                            resourceAdequacy: true,
                          },
                        });
                        setProfessionalModel(result);
                      } catch (error) {
                        console.error("Error generating model:", error);
                      } finally {
                        setIsGeneratingModel(false);
                      }
                    }}
                    disabled={isGeneratingModel}
                    className="flex items-center gap-3 font-semibold px-8 py-3.5 rounded-lg transition-all disabled:opacity-50"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                  >
                    {isGeneratingModel ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        Generating Model...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" />
                        Generate Bank-Ready Model
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results */}
              {professionalModel && (
                <div className="space-y-8">
                  {/* Executive Summary */}
                  <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                      Executive Summary
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {/* Key Metrics */}
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          Total CapEx
                        </p>
                        <p className="text-2xl font-bold text-white">
                          ${(professionalModel.summary.totalCapex / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          Equity Investment
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">
                          ${(professionalModel.summary.equityInvestment / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          Levered IRR
                        </p>
                        <p className="text-2xl font-bold text-amber-300">
                          {(professionalModel.summary.leveredIRR * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          Unlevered IRR
                        </p>
                        <p className="text-2xl font-bold text-blue-300">
                          {(professionalModel.summary.unleveredIRR * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">NPV (25yr)</p>
                        <p className="text-2xl font-bold text-emerald-300">
                          ${(professionalModel.summary.npv / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">MOIC</p>
                        <p className="text-2xl font-bold text-purple-300">
                          {professionalModel.summary.moic.toFixed(2)}x
                        </p>
                      </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">LCOS</p>
                        <p className="text-2xl font-bold text-cyan-300">
                          ${professionalModel.summary.lcos.toFixed(0)}/MWh
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Min DSCR</p>
                        <p
                          className={`text-2xl font-bold ${professionalModel.summary.minimumDSCR >= 1.25 ? "text-emerald-300" : "text-red-400"}`}
                        >
                          {professionalModel.summary.minimumDSCR.toFixed(2)}x
                        </p>
                        <p className="text-xs text-slate-500">Target: ≥1.25x</p>
                      </div>
                      <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Avg DSCR</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {professionalModel.summary.averageDSCR.toFixed(2)}x
                        </p>
                      </div>
                      <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">
                          Simple Payback
                        </p>
                        <p className="text-2xl font-bold text-amber-400">
                          {professionalModel.summary.simplePayback.toFixed(1)} yrs
                        </p>
                      </div>
                      <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Y1 Revenue</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          ${(professionalModel.summary.totalAnnualRevenue / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Streams */}
                  <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Year 1 Revenue Breakdown ({selectedISORegion})
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {professionalModel.revenueProjection?.[0] &&
                        Object.entries(professionalModel.revenueProjection[0])
                          .filter(([key]) => key !== "year" && key !== "totalRevenue")
                          .map(([stream, value]) => (
                            <div key={stream} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <p className="text-xs text-slate-500 capitalize">
                                {stream.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className="text-lg font-bold text-emerald-300">
                                ${typeof value === "number" ? (value / 1000).toFixed(0) : 0}k
                              </p>
                            </div>
                          ))}
                    </div>
                  </div>

                  {/* 3-Statement Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Income Statement */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Income Statement (Y1)
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Revenue</span>
                          <span className="font-mono">
                            $
                            {(
                              professionalModel.incomeStatements?.[0]?.totalRevenue / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Operating Costs</span>
                          <span className="font-mono text-red-300">
                            -$
                            {(
                              professionalModel.incomeStatements?.[0]?.totalOpex / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300 border-t border-slate-600 pt-2">
                          <span>EBITDA</span>
                          <span className="font-mono text-emerald-300">
                            $
                            {(
                              professionalModel.incomeStatements?.[0]?.ebitda / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Depreciation</span>
                          <span className="font-mono text-slate-400">
                            -$
                            {(
                              professionalModel.incomeStatements?.[0]?.depreciation / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Interest</span>
                          <span className="font-mono text-red-300">
                            -$
                            {(
                              professionalModel.incomeStatements?.[0]?.interestExpense / 1000000 ||
                              0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                          <span>Net Income</span>
                          <span className="font-mono text-emerald-400">
                            $
                            {(
                              professionalModel.incomeStatements?.[0]?.netIncome / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Sheet */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        Balance Sheet (Y1)
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Total Assets</span>
                          <span className="font-mono">
                            $
                            {(
                              professionalModel.balanceSheets?.[0]?.totalAssets / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Total Liabilities</span>
                          <span className="font-mono text-red-300">
                            $
                            {(
                              professionalModel.balanceSheets?.[0]?.totalLiabilities / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Total Equity</span>
                          <span className="font-mono text-blue-300">
                            $
                            {(
                              professionalModel.balanceSheets?.[0]?.totalEquity / 1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                          <span>D/E Ratio</span>
                          <span className="font-mono">
                            {(
                              (professionalModel.balanceSheets?.[0]?.totalLiabilities || 0) /
                              (professionalModel.balanceSheets?.[0]?.totalEquity || 1)
                            ).toFixed(2)}
                            x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cash Flow */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        Cash Flow (Y1)
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Operating CF</span>
                          <span className="font-mono text-emerald-300">
                            $
                            {(
                              professionalModel.cashFlowStatements?.[0]?.operatingCashFlow /
                                1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Principal Repayment</span>
                          <span className="font-mono text-red-300">
                            -$
                            {(
                              professionalModel.cashFlowStatements?.[0]?.principalRepayment /
                                1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>DSCR</span>
                          <span
                            className={`font-mono ${(professionalModel.debtSchedule?.[0]?.dscr || 0) >= 1.25 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {(professionalModel.debtSchedule?.[0]?.dscr || 0).toFixed(2)}x
                          </span>
                        </div>
                        <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                          <span>Free Cash Flow</span>
                          <span className="font-mono text-emerald-400">
                            $
                            {(
                              professionalModel.cashFlowStatements?.[0]?.freeCashFlowToEquity /
                                1000000 || 0
                            ).toFixed(2)}
                            M
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DSCR & Debt Schedule Chart (simplified table) */}
                  <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-amber-400" />
                      Debt Service Coverage Ratio (DSCR) by Year
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700">
                            <th className="text-left py-2">Year</th>
                            {[1, 2, 3, 4, 5, 10, 15, 20, 25].map((y) => (
                              <th key={y} className="text-right py-2">
                                {y}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-white">
                            <td className="py-2 font-medium">DSCR</td>
                            {[0, 1, 2, 3, 4, 9, 14, 19, 24].map((i, idx) => (
                              <td
                                key={idx}
                                className={`text-right py-2 font-mono ${
                                  (professionalModel.debtSchedule?.[i]?.dscr || 0) >= 1.25
                                    ? "text-emerald-400"
                                    : (professionalModel.debtSchedule?.[i]?.dscr || 0) >= 1.0
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                }`}
                              >
                                {(professionalModel.debtSchedule?.[i]?.dscr || 0).toFixed(2)}x
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="text-emerald-400">●</span> ≥1.25x (Bankable) |
                      <span className="text-yellow-400 ml-2">●</span> 1.0-1.25x (Marginal) |
                      <span className="text-red-400 ml-2">●</span> &lt;1.0x (Below Threshold)
                    </p>
                  </div>

                  {/* Export Options */}
                  <div className="flex justify-center gap-4 mt-8">
                    <button
                      onClick={() => {
                        // Export to Excel (placeholder)
                        alert(
                          "Excel export coming soon! This will generate a full 25-year financial model workbook."
                        );
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(16,185,129,0.15)', color: 'rgb(52,211,153)', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      Export to Excel
                    </button>
                    <button
                      onClick={() => {
                        // Export to PDF (placeholder)
                        alert(
                          "PDF export coming soon! This will generate a bank-ready investment memo."
                        );
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(59,130,246,0.15)', color: 'rgb(96,165,250)', border: '1px solid rgba(59,130,246,0.3)' }}
                    >
                      <FileText className="w-5 h-5" />
                      Export to PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
          data={{
            totalEquipmentCost: financialMetrics?.equipmentCost,
            installationCost: financialMetrics?.installationCost,
            totalProjectCost: financialMetrics?.totalProjectCost ?? localSystemCost,
            netCost: financialMetrics?.netCost,
            itcCredit: financialMetrics?.taxCredit,
            itcRate: financialMetrics?.taxCredit && financialMetrics?.totalProjectCost
              ? financialMetrics.taxCredit / financialMetrics.totalProjectCost
              : 0.30,
            annualSavings: estimatedAnnualSavings,
            paybackYears,
            npv: financialMetrics?.npv,
            irr: financialMetrics?.irr,
            roi25Year: financialMetrics?.roi25Year,
            lcoe: financialMetrics?.levelizedCostOfStorage,
            equipmentBreakdown: financialMetrics ? [
              { label: "Battery Storage", cost: (financialMetrics.equipmentCost ?? 0) * 0.55, notes: `${storageSizeMW.toFixed(1)} MW × ${durationHours}h LFP` },
              { label: "Power Conversion (PCS)", cost: (financialMetrics.equipmentCost ?? 0) * 0.18, notes: `Inverters, switchgear` },
              { label: "Balance of System", cost: (financialMetrics.equipmentCost ?? 0) * 0.12, notes: `BMS, enclosure, cabling` },
              { label: "EMS / Controls", cost: (financialMetrics.equipmentCost ?? 0) * 0.08, notes: `Energy management software` },
              { label: "Transformer / Interconnect", cost: (financialMetrics.equipmentCost ?? 0) * 0.07, notes: `Grid connection` },
            ] : undefined,
            cashFlowProjection: estimatedAnnualSavings > 0 ? Array.from({ length: 10 }, (_, i) => {
              const yr = i + 1;
              const annualEsc = estimatedAnnualSavings * Math.pow(1.025, i);
              return {
                year: yr,
                savings: Math.round(annualEsc),
                cumulative: Math.round(
                  Array.from({ length: yr }, (__, j) => estimatedAnnualSavings * Math.pow(1.025, j))
                    .reduce((a, b) => a + b, 0) - (financialMetrics?.netCost ?? localSystemCost)
                ),
              };
            }) : undefined,
            sensitivity: [
              { variable: "Electricity Rate", low: paybackYears * 1.25, base: paybackYears, high: paybackYears * 0.8, unit: "yrs" },
              { variable: "Equipment Cost", low: paybackYears * 0.85, base: paybackYears, high: paybackYears * 1.15, unit: "yrs" },
              { variable: "Battery Degradation", low: paybackYears * 0.95, base: paybackYears, high: paybackYears * 1.12, unit: "yrs" },
            ],
          } satisfies ProQuoteFinancialData}
        />
      </div>
    </div>
  );
}
