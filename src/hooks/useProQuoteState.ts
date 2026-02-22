import { useState } from "react";
import type { ProfessionalModelResult } from "@/services/professionalFinancialModel";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";

/**
 * VIEW/MODAL STATE HOOK
 *
 * Manages all UI state for ProQuote views, modals, and document extraction.
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1G, Feb 2026)
 *
 * State organized by domain:
 * - View navigation (viewMode, showQuotePreview, etc.)
 * - Professional model state
 * - Document upload/extraction state
 * - Interactive dashboard integration
 */

export type ViewMode =
  | "landing"
  | "custom-config"
  | "interactive-dashboard"
  | "professional-model"
  | "upload"
  | "upload-first";

interface ProjectInfo {
  projectName?: string;
  projectLocation?: string;
  projectGoals?: string;
  projectSchedule?: string;
  userName?: string;
  email?: string;
  userId?: string;
}

export function useProQuoteState(initialView: ViewMode = "landing") {
  // ═══ View Navigation State ═══
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<"word" | "excel">("word");
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);

  // ═══ Project Info State ═══
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // ═══ Professional Financial Model State ═══
  const [professionalModel, setProfessionalModel] = useState<ProfessionalModelResult | null>(null);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [selectedISORegion, setSelectedISORegion] = useState<
    "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | "SPP"
  >("CAISO");
  const [projectLeverage, setProjectLeverage] = useState(60); // % debt
  const [interestRate, setInterestRate] = useState(7); // %
  const [loanTermYears, setLoanTermYears] = useState(15);

  // ═══ Interactive Dashboard Integration ═══
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, _setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);

  // ═══ Document Upload / Path A State ═══
  const [extractedData, setExtractedData] = useState<ExtractedSpecsData | null>(null);
  const [_uploadedDocuments, setUploadedDocuments] = useState<ParsedDocument[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(true);
  const [showExtractionSuccessModal, setShowExtractionSuccessModal] = useState(false);
  const [pendingExtractedData, setPendingExtractedData] = useState<ExtractedSpecsData | null>(null);
  const [showDataReview, setShowDataReview] = useState(false);

  return {
    // View Navigation
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

    // Project Info
    projectInfo,
    setProjectInfo,

    // Professional Model
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
    setLoanTermYears,

    // Interactive Dashboard
    solarMW,
    setSolarMW,
    windMW,
    _setWindMW,
    generatorMW,
    setGeneratorMW,

    // Document Extraction
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
  };
}
