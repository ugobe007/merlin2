import { useEffect, useCallback } from "react";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";

/**
 * Phase 1G Part 2 - Effects & Callbacks Hook
 * 
 * Manages all side effects and callbacks for AdvancedQuoteBuilder:
 * - View synchronization between Interactive Dashboard ↔ Custom Config
 * - View reset on modal open
 * - Wizard config lazy loading
 * - Document extraction completion handler
 * - Extracted data application to form
 */

interface UseProQuoteEffectsParams {
  // View state
  show: boolean;
  viewMode: string;
  initialView: string;
  
  // Interactive Dashboard renewable values
  solarMW: number;
  windMW: number;
  generatorMW: number;
  
  // Setters for view management
  setViewMode: (mode: any) => void;
  setShowUploadSection: (show: boolean) => void;
  
  // Setters for renewables sync
  setIncludeRenewables: (include: boolean) => void;
  setSolarPVIncluded: (included: boolean) => void;
  setSolarCapacityKW: (capacity: number) => void;
  setSolarMW: (mw: number) => void;
  setWindTurbineIncluded: (included: boolean) => void;
  setWindCapacityKW: (capacity: number) => void;
  setGeneratorIncluded: (included: boolean) => void;
  setGeneratorCapacityKW: (capacity: number) => void;
  setGeneratorMW: (mw: number) => void;
  
  // Setters for extraction flow
  setPendingExtractedData: (data: any) => void;
  setExtractedData: (data: any) => void;
  setUploadedDocuments: (docs: any) => void;
  setShowExtractionSuccessModal: (show: boolean) => void;
  setShowDataReview: (show: boolean) => void;
  
  // Setters for form fields
  setLocation: (location: string) => void;
  setUtilityRate: (rate: number) => void;
  setDemandCharge: (charge: number) => void;
  
  // Functions
  onStorageSizeChange: (size: number) => void;
  loadWizardConfig: () => void;
}

export function useProQuoteEffects(params: UseProQuoteEffectsParams) {
  const {
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
  } = params;

  // ═══ EFFECT 1: Sync Interactive Dashboard renewable values to Custom Configuration form ═══
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
        setGeneratorIncluded(true);
        setGeneratorCapacityKW(generatorMW * 1000); // Convert MW to kW
      }
    }
  }, [
    viewMode,
    solarMW,
    windMW,
    generatorMW,
    setIncludeRenewables,
    setSolarPVIncluded,
    setSolarCapacityKW,
    setWindTurbineIncluded,
    setWindCapacityKW,
    setGeneratorIncluded,
    setGeneratorCapacityKW,
  ]);

  // ═══ EFFECT 2: Reset to initialView when modal opens AND load wizard config if needed ═══
  useEffect(() => {
    if (show) {
      // If upload mode, show dedicated upload-first view
      if (initialView === "upload") {
        setViewMode("upload-first");
        setShowUploadSection(true);
      } else {
        setViewMode(initialView);
      }
      window.scrollTo(0, 0);

      // Load wizard config immediately if we're going to custom-config view
      if (initialView === "custom-config" || initialView === "upload") {
        // Small delay to ensure state is set
        setTimeout(() => {
          loadWizardConfig();
        }, 100);
      }
    }
  }, [show, initialView, loadWizardConfig, setViewMode, setShowUploadSection]);

  // ═══ EFFECT 3: Also load wizard config when viewMode changes to custom-config (backup) ═══
  useEffect(() => {
    if (show && viewMode === "custom-config") {
      const configData = sessionStorage.getItem("advancedBuilderConfig");
      if (configData) {
        loadWizardConfig();
      }
    }
  }, [show, viewMode, loadWizardConfig]);

  // ═══ CALLBACK 1: Handler for document extraction completion (Path A) ═══
  const handleExtractionComplete = useCallback(
    (data: ExtractedSpecsData, documents: ParsedDocument[]) => {
      if (import.meta.env.DEV) {
        console.log("📄 [AdvancedQuoteBuilder] Extraction complete:", data);
      }

      // Store pending data and show success modal
      setPendingExtractedData(data);
      setExtractedData(data);
      setUploadedDocuments(documents);
      setShowExtractionSuccessModal(true);

      // Don't auto-apply data yet - let user review first
    },
    [setPendingExtractedData, setExtractedData, setUploadedDocuments, setShowExtractionSuccessModal]
  );

  // ═══ CALLBACK 2: Apply extracted data to form (called after user reviews and confirms) ═══
  const applyExtractedData = useCallback(
    (data: ExtractedSpecsData) => {
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
        setGeneratorIncluded(true);
        setIncludeRenewables(true);
        setGeneratorCapacityKW(data.existingInfrastructure.generatorKW);
        setGeneratorMW(data.existingInfrastructure.generatorKW / 1000);
      }

      // Close modals and show config page
      setShowExtractionSuccessModal(false);
      setShowDataReview(false);
      setShowUploadSection(false);
      setViewMode("custom-config");
    },
    [
      onStorageSizeChange,
      setLocation,
      setUtilityRate,
      setDemandCharge,
      setSolarPVIncluded,
      setIncludeRenewables,
      setSolarCapacityKW,
      setSolarMW,
      setGeneratorIncluded,
      setGeneratorCapacityKW,
      setGeneratorMW,
      setShowExtractionSuccessModal,
      setShowDataReview,
      setShowUploadSection,
      setViewMode,
    ]
  );

  return {
    handleExtractionComplete,
    applyExtractedData,
  };
}
