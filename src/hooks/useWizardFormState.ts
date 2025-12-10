import { useState } from 'react';

/**
 * Solar space configuration interface
 */
export interface SolarSpaceConfig {
  hasRoofSpace: boolean;
  roofAreaSqFt: number;
  hasParkingLot: boolean;
  parkingAreaSqFt: number;
  hasOpenLand: boolean;
  openLandAcres: number;
  autoCalculated: boolean;
}

/**
 * Wind configuration interface
 */
export interface WindConfig {
  turbineModel: 'small' | 'medium' | 'large' | 'xl';
  turbineCount: number;
  avgWindSpeed: number;
  hubHeight: number;
  manualMW: number;
}

/**
 * Generator configuration interface
 */
export interface GeneratorConfig {
  fuelType: 'diesel' | 'natural-gas' | 'propane' | 'biodiesel';
  runtimeHours: number;
  loadFactor: number;
  manualMW: number;
}

/**
 * EV charger configuration interface
 */
export interface EVChargerConfig {
  hasChargers: boolean;
  level2Count: number;
  dcFastCount: number;
}

/**
 * AI use case recommendation interface
 */
export interface AIUseCaseRecommendation {
  message: string;
  savings: string;
  roi: string;
  configuration: string;
}

/**
 * AI baseline data interface
 */
export interface AIBaselineData {
  suggestedStorageMW: number;
  suggestedDurationHours: number;
  estimatedAnnualSavings: number;
  paybackYears: number;
  confidence: number;
}

/**
 * Custom hook for managing all wizard form state
 * 
 * Organizes state by logical sections:
 * - Templates & Industry
 * - Use Case Data
 * - System Configuration
 * - Renewables & Power Generation
 * - Location & Pricing
 * - Advanced Analytics
 * - AI Suggestions
 * 
 * @returns Form state and setter functions
 */
export function useWizardFormState() {
  // ============================================
  // SECTION 1: Templates & Industry
  // ============================================
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState(true);

  // ============================================
  // SECTION 2: Use Case Data (Step 1 responses)
  // ============================================
  const [useCaseData, setUseCaseData] = useState<{ [key: string]: any }>({});
  const [aiUseCaseRecommendation, setAiUseCaseRecommendation] = useState<AIUseCaseRecommendation | null>(null);

  // ============================================
  // SECTION 3: System Configuration (BESS sizing)
  // ============================================
  const [storageSizeMW, setStorageSizeMW] = useState(2);
  const [durationHours, setDurationHours] = useState(4);

  // ============================================
  // SECTION 4: Renewables & Power Generation
  // ============================================
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);

  // Solar space configuration (with intelligent auto-calculation)
  const [solarSpaceConfig, setSolarSpaceConfig] = useState<SolarSpaceConfig>({
    hasRoofSpace: false,
    roofAreaSqFt: 0,
    hasParkingLot: false,
    parkingAreaSqFt: 0,
    hasOpenLand: false,
    openLandAcres: 0,
    autoCalculated: false
  });

  // EV charger configuration
  const [evChargerConfig, setEVChargerConfig] = useState<EVChargerConfig>({
    hasChargers: false,
    level2Count: 0,
    dcFastCount: 0
  });

  // Wind configuration
  const [windConfig, setWindConfig] = useState<WindConfig>({
    turbineModel: 'small',
    turbineCount: 1,
    avgWindSpeed: 12,
    hubHeight: 80,
    manualMW: 0
  });

  // Generator configuration
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    fuelType: 'natural-gas',
    runtimeHours: 8760,
    loadFactor: 0.75,
    manualMW: 0
  });

  // ============================================
  // SECTION 5: Location & Pricing
  // ============================================
  const [location, setLocation] = useState('');
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [knowsRate, setKnowsRate] = useState(false);

  // Installation, shipping, financing options
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');

  // Cost breakdown
  const [costs, setCosts] = useState({
    equipment: 0,
    installation: 0,
    shipping: 0,
    softCosts: 0,
    total: 0
  });

  // Equipment breakdown (batteries, inverters, containers, etc.)
  const [equipmentBreakdown, setEquipmentBreakdown] = useState<any>(null);

  // ============================================
  // SECTION 6: Advanced Analytics (BESS ML/Optimization)
  // ============================================
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [loadPatternAnalysis, setLoadPatternAnalysis] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [controlStrategy, setControlStrategy] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [batteryModelData, setBatteryModelData] = useState<any>(null);
  const [mpcStrategy, setMpcStrategy] = useState<any>(null);
  const [analyticsConfidence, setAnalyticsConfidence] = useState(0);

  // ============================================
  // SECTION 7: AI Suggestions & Baseline
  // ============================================
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
    title: string;
    description: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
    savings?: string;
    action: () => void;
  }>>([]);

  const [aiBaseline, setAiBaseline] = useState<AIBaselineData | null>(null);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Reset all form state to defaults
   */
  const resetFormState = () => {
    setSelectedTemplate('');
    setUseTemplate(true);
    setUseCaseData({});
    setAiUseCaseRecommendation(null);
    setStorageSizeMW(2);
    setDurationHours(4);
    setIncludeRenewables(false);
    setSolarMW(0);
    setWindMW(0);
    setGeneratorMW(0);
    setSolarSpaceConfig({
      hasRoofSpace: false,
      roofAreaSqFt: 0,
      hasParkingLot: false,
      parkingAreaSqFt: 0,
      hasOpenLand: false,
      openLandAcres: 0,
      autoCalculated: false
    });
    setEVChargerConfig({
      hasChargers: false,
      level2Count: 0,
      dcFastCount: 0
    });
    setWindConfig({
      turbineModel: 'small',
      turbineCount: 1,
      avgWindSpeed: 12,
      hubHeight: 80,
      manualMW: 0
    });
    setGeneratorConfig({
      fuelType: 'natural-gas',
      runtimeHours: 8760,
      loadFactor: 0.75,
      manualMW: 0
    });
    setLocation('');
    setElectricityRate(0.15);
    setKnowsRate(false);
    setSelectedInstallation('epc');
    setSelectedShipping('best-value');
    setSelectedFinancing('cash');
    setCosts({
      equipment: 0,
      installation: 0,
      shipping: 0,
      softCosts: 0,
      total: 0
    });
    setEquipmentBreakdown(null);
    setShowAdvancedAnalytics(false);
    setLoadPatternAnalysis(null);
    setOptimizationResults(null);
    setControlStrategy(null);
    setForecastData(null);
    setBatteryModelData(null);
    setMpcStrategy(null);
    setAnalyticsConfidence(0);
    setAiSuggestions([]);
    setAiBaseline(null);
  };

  /**
   * Get total renewable capacity in MW
   */
  const getTotalRenewableCapacity = (): number => {
    return solarMW + windMW + generatorMW;
  };

  /**
   * Get total system capacity (BESS + renewables) in MW
   */
  const getTotalSystemCapacity = (): number => {
    return storageSizeMW + getTotalRenewableCapacity();
  };

  /**
   * Check if any renewables are configured
   */
  const hasRenewables = (): boolean => {
    return includeRenewables && getTotalRenewableCapacity() > 0;
  };

  /**
   * Get system configuration summary object
   */
  const getConfigurationSummary = () => {
    return {
      // Industry & Use Case
      industry: selectedTemplate,
      useTemplate,
      useCaseAnswers: useCaseData,
      
      // BESS Configuration
      storageSizeMW,
      durationHours,
      storageCapacityMWh: storageSizeMW * durationHours,
      
      // Renewables
      includeRenewables,
      solarMW,
      windMW,
      generatorMW,
      totalRenewableMW: getTotalRenewableCapacity(),
      
      // Location & Economics
      location,
      electricityRate,
      
      // Options
      installation: selectedInstallation,
      shipping: selectedShipping,
      financing: selectedFinancing,
      
      // Costs
      costs,
      equipmentBreakdown,
      
      // Total System
      totalSystemMW: getTotalSystemCapacity(),
      hasRenewables: hasRenewables()
    };
  };

  return {
    // Templates & Industry
    selectedTemplate,
    setSelectedTemplate,
    useTemplate,
    setUseTemplate,
    
    // Use Case Data
    useCaseData,
    setUseCaseData,
    aiUseCaseRecommendation,
    setAiUseCaseRecommendation,
    
    // System Configuration
    storageSizeMW,
    setStorageSizeMW,
    durationHours,
    setDurationHours,
    
    // Renewables & Power Generation
    includeRenewables,
    setIncludeRenewables,
    solarMW,
    setSolarMW,
    windMW,
    setWindMW,
    generatorMW,
    setGeneratorMW,
    solarSpaceConfig,
    setSolarSpaceConfig,
    evChargerConfig,
    setEVChargerConfig,
    windConfig,
    setWindConfig,
    generatorConfig,
    setGeneratorConfig,
    
    // Location & Pricing
    location,
    setLocation,
    electricityRate,
    setElectricityRate,
    knowsRate,
    setKnowsRate,
    selectedInstallation,
    setSelectedInstallation,
    selectedShipping,
    setSelectedShipping,
    selectedFinancing,
    setSelectedFinancing,
    costs,
    setCosts,
    equipmentBreakdown,
    setEquipmentBreakdown,
    
    // Advanced Analytics
    showAdvancedAnalytics,
    setShowAdvancedAnalytics,
    loadPatternAnalysis,
    setLoadPatternAnalysis,
    optimizationResults,
    setOptimizationResults,
    controlStrategy,
    setControlStrategy,
    forecastData,
    setForecastData,
    batteryModelData,
    setBatteryModelData,
    mpcStrategy,
    setMpcStrategy,
    analyticsConfidence,
    setAnalyticsConfidence,
    
    // AI Suggestions
    aiSuggestions,
    setAiSuggestions,
    aiBaseline,
    setAiBaseline,
    
    // Helper functions
    resetFormState,
    getTotalRenewableCapacity,
    getTotalSystemCapacity,
    hasRenewables,
    getConfigurationSummary
  };
}

export type WizardFormState = ReturnType<typeof useWizardFormState>;
