import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Zap, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { formatTotalProjectSavings, formatSolarSavings } from '../../utils/financialFormatting';
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';
import { getAIOptimization, type AIOptimizationResult } from '../../services/aiOptimizationService';
import { AIInsightBadge, AIOptimizationButton } from './AIInsightBadge';

// Scroll utility function
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    });
  }
};

// Custom slider styles
const sliderStyles = `
  .slider-purple::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
    border: 2px solid white;
  }
  
  .slider-purple::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
    border: 2px solid white;
  }
  
  .slider-green::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    border: 2px solid white;
  }
  
  .slider-green::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    border: 2px solid white;
  }
`;

interface InteractiveConfigDashboardProps {
  initialStorageSizeMW: number;
  initialDurationHours: number;
  initialSolarMW: number;
  initialWindMW?: number;
  initialGeneratorMW?: number;
  solarSpaceConfig?: {
    spaceType: 'rooftop' | 'ground' | 'canopy' | 'mixed';
    rooftopSqFt?: number;
    groundAcres?: number;
    useAI: boolean;
  };
  evChargerConfig?: {
    level2_11kw: number;
    level2_19kw: number;
    dcfast_50kw: number;
    dcfast_150kw: number;
    dcfast_350kw: number;
  };
  windConfig?: {
    turbineSize: '2.5' | '3.0' | '5.0';
    numberOfTurbines: number;
    useAI: boolean;
  };
  generatorConfig?: {
    generatorType: 'diesel' | 'natural-gas' | 'dual-fuel';
    numberOfUnits: number;
    sizePerUnit: number;
    useAI: boolean;
  };
  industryTemplate: string;
  location: string;
  electricityRate: number;
  useCaseData?: Record<string, any>; // EV charger counts, hotel rooms, etc.
  onConfigurationChange: (config: {
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
  }) => void;
  onBack?: () => void; // Optional - only show if provided
  onContinue?: () => void; // Optional - only show if provided
  continueButtonText?: string; // Optional - customize button text
}

const InteractiveConfigDashboard: React.FC<InteractiveConfigDashboardProps> = ({
  initialStorageSizeMW,
  initialDurationHours,
  initialSolarMW,
  initialWindMW = 0,
  initialGeneratorMW = 0,
  solarSpaceConfig,
  evChargerConfig,
  windConfig,
  generatorConfig,
  industryTemplate,
  location,
  electricityRate,
  useCaseData,
  onConfigurationChange,
  onBack,
  onContinue,
  continueButtonText = 'Continue to Location & Pricing'
}) => {
  // Configuration state
  const [storageSizeMW, setStorageSizeMW] = useState(initialStorageSizeMW);
  const [durationHours, setDurationHours] = useState(initialDurationHours);
  const [solarMW, setSolarMW] = useState(initialSolarMW);
  const [windMW, setWindMW] = useState(initialWindMW);
  const [generatorMW, setGeneratorMW] = useState(initialGeneratorMW);
  
  // Financial targets
  const [targetROI, setTargetROI] = useState(4); // years
  const [maxBudget, setMaxBudget] = useState(10); // million USD
  const [minSavings, setMinSavings] = useState(500000); // annual savings
  
  // New financial and environmental sliders
  const [profitabilityTarget, setProfitabilityTarget] = useState(3); // 1-5 scale for revenue opportunities
  const [environmentalImpact, setEnvironmentalImpact] = useState(0); // calculated based on configuration
  
  // Grid connectivity and additional controls
  const [gridConnectivity, setGridConnectivity] = useState(0.8); // 0 = off-grid, 1 = fully on-grid
  const [incentivesLevel, setIncentivesLevel] = useState(3); // 1-5 scale for incentives/credits
  const [lifetimeYears, setLifetimeYears] = useState(20); // Investment lifetime in years

  // Track applied configurations for visual feedback
  const [appliedConfig, setAppliedConfig] = useState<string | null>(null);

  // Log received configuration data
  useEffect(() => {
    console.log('📊 [InteractiveConfigDashboard] Received configuration:', {
      solarMW,
      windMW,
      generatorMW,
      solarSpaceConfig,
      evChargerConfig,
      windConfig,
      generatorConfig
    });
  }, [solarMW, windMW, generatorMW, solarSpaceConfig, evChargerConfig, windConfig, generatorConfig]);

  // Track clicked dashboard items for visual feedback
  const [clickedItems, setClickedItems] = useState<{
    systemSize: boolean;
    investment: boolean;
    revenue: boolean;
    roi: boolean;
    payback: boolean;
    quality: boolean;
  }>({
    systemSize: false,
    investment: false,
    revenue: false,
    roi: false,
    payback: false,
    quality: false
  });

  // Track active arrows for guidance
  const [activeArrow, setActiveArrow] = useState<string | null>(null);

  // Handle dashboard item clicks with visual feedback
  const handleDashboardClick = (itemKey: keyof typeof clickedItems, sectionId: string) => {
    // Mark item as clicked
    setClickedItems(prev => ({
      ...prev,
      [itemKey]: true
    }));
    
    // Show arrow for 3 seconds
    setActiveArrow(sectionId);
    setTimeout(() => {
      setActiveArrow(null);
    }, 3000);
    
    // Scroll to section
    scrollToSection(sectionId);
  };

  // Calculated values
  const [calculations, setCalculations] = useState({
    totalEnergyMWh: 0,
    totalProjectCost: 0,
    annualSavings: 0,
    paybackYears: 0,
    roiPercent: 0,
    carbonOffset: 0,
    // Revenue breakdown from centralized calculation
    peakShavingSavings: 0,
    demandChargeSavings: 0,
    gridServiceRevenue: 0,
    solarSavings: 0,
    windSavings: 0
  });

  // AI Optimization state
  const [aiOptimization, setAiOptimization] = useState<AIOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAIInsight, setShowAIInsight] = useState(false);

  // Sample configurations based on user preferences
  const [sampleConfigs, setSampleConfigs] = useState<Array<{
    name: string;
    description: string;
    config: {
      storageSizeMW: number;
      durationHours: number;
      solarMW: number;
      windMW: number;
      generatorMW: number;
    };
    metrics: {
      cost: number;
      savings: number;
      payback: number;
      roi: number;
    };
  }>>([]);

  // Calculate real-time metrics when configuration changes
  useEffect(() => {
    const calculateMetrics = async () => {
      // 🔥 USE CENTRALIZED CALCULATION SERVICE - Single source of truth from database
      console.log('📊 InteractiveConfigDashboard calculating from database...');
      
      const result = await calculateFinancialMetrics({
        storageSizeMW,
        durationHours,
        solarMW,
        windMW,
        location: 'California', // Default location
        electricityRate
      });
      
      console.log('💰 InteractiveConfigDashboard results from centralized service:', {
        netCost: result.netCost,
        annualSavings: result.annualSavings,
        paybackYears: result.paybackYears,
        roi10Year: result.roi10Year,
        dataSource: result.dataSource
      });
      
      // Calculate totalEnergyMWh locally since centralized service doesn't return it
      const totalEnergyMWh = storageSizeMW * durationHours;
      
      const carbonOffset = (totalEnergyMWh * 0.4 + solarMW * 1000 * 8760 * 0.3 * 0.0004) * 365; // tons CO2/year
      
      console.log('📊 Setting dashboard calculations:', {
        totalEnergyMWh,
        totalProjectCost: result.netCost,
        annualSavings: result.annualSavings,
        paybackYears: result.paybackYears,
        roiPercent: result.roi10Year,
        carbonOffset,
        breakdown: {
          peakShavingSavings: result.peakShavingSavings,
          demandChargeSavings: result.demandChargeSavings,
          gridServiceRevenue: result.gridServiceRevenue,
          solarSavings: result.solarSavings,
          windSavings: result.windSavings
        }
      });
      
      setCalculations({
        totalEnergyMWh: totalEnergyMWh,
        totalProjectCost: result.netCost,
        annualSavings: result.annualSavings,
        paybackYears: result.paybackYears,
        roiPercent: result.roi10Year,
        carbonOffset,
        // Store breakdown values from centralized calculation
        peakShavingSavings: result.peakShavingSavings,
        demandChargeSavings: result.demandChargeSavings,
        gridServiceRevenue: result.gridServiceRevenue,
        solarSavings: result.solarSavings,
        windSavings: result.windSavings
      });

      // Update parent component
      onConfigurationChange({
        storageSizeMW,
        durationHours,
        solarMW,
        windMW,
        generatorMW
      });

      // Generate sample configurations that meet user preferences
      generateSampleConfigs();
    };
    
    calculateMetrics();
  }, [storageSizeMW, durationHours, solarMW, windMW, generatorMW, targetROI, maxBudget, minSavings, profitabilityTarget, electricityRate]);

  // AI Optimization - Analyze configuration when it changes
  useEffect(() => {
    const analyzeConfiguration = async () => {
      if (!industryTemplate) return;

      try {
        // Derive grid connection type from gridConnectivity slider
        let gridConnection: 'grid-tied' | 'microgrid' | 'off-grid' = 'grid-tied';
        if (gridConnectivity === 0) {
          gridConnection = 'off-grid';
        } else if (gridConnectivity < 0.5) {
          gridConnection = 'microgrid'; // Limited grid, mostly autonomous
        }
        
        // Determine if backup is required based on industry and config
        const hasBackupRequirement = 
          industryTemplate === 'hospital' || 
          industryTemplate === 'datacenter' ||
          industryTemplate === 'airport' ||
          generatorMW > 0 || // Has backup generator
          gridConnectivity < 0.3; // Very limited grid access
        
        const result = await getAIOptimization({
          storageSizeMW,
          durationHours,
          useCase: industryTemplate,
          electricityRate,
          solarMW,
          windMW,
          generatorMW, // Pass generator capacity
          useCaseData, // Pass EV charger counts, hotel rooms, etc.
          gridConnection, // Pass grid reliability context
          gridConnectivity, // Pass grid reliability score (0-1)
          hasBackupRequirement // Pass critical infrastructure flag
        });

        setAiOptimization(result);
        
        // Show insight if there's a suggestion
        if (!result.isOptimal && result.suggestion) {
          setShowAIInsight(true);
        }
      } catch (error) {
        console.error('AI optimization analysis failed:', error);
      }
    };

    // Debounce analysis to avoid too many calls
    const timer = setTimeout(analyzeConfiguration, 1000);
    return () => clearTimeout(timer);
  }, [storageSizeMW, durationHours, industryTemplate, electricityRate, solarMW, windMW, useCaseData, gridConnectivity, generatorMW]);

  // Handle AI optimization button click
  const handleAIOptimization = async () => {
    if (!aiOptimization?.suggestion) return;

    setIsOptimizing(true);
    
    // Animate to suggested values
    const suggestion = aiOptimization.suggestion;
    
    // Update configuration with AI suggestion
    setStorageSizeMW(suggestion.storageSizeMW);
    setDurationHours(suggestion.durationHours);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsOptimizing(false);
    setShowAIInsight(false);
  };

  const generateSampleConfigs = () => {
    const configs = [
      {
        name: "Cost Optimized",
        description: "Minimum cost while meeting operational needs",
        config: {
          storageSizeMW: Math.round((Math.max(1, storageSizeMW * 0.8)) * 10) / 10,
          durationHours: Math.round((Math.max(2, durationHours * 0.9)) * 10) / 10,
          solarMW: Math.round((solarMW * 0.7) * 10) / 10,
          windMW: 0,
          generatorMW: Math.round((storageSizeMW * 0.3) * 10) / 10
        }
      },
      {
        name: "Performance Balanced",
        description: "Balanced approach optimizing cost and performance",
        config: {
          storageSizeMW: Math.round(storageSizeMW * 10) / 10,
          durationHours: Math.round(durationHours * 10) / 10,
          solarMW: Math.round(solarMW * 10) / 10,
          windMW: Math.round(windMW * 10) / 10,
          generatorMW: Math.round(generatorMW * 10) / 10
        }
      },
      {
        name: "Maximum ROI",
        description: "Optimized for fastest payback and highest returns",
        config: {
          storageSizeMW: Math.round((storageSizeMW * 1.2) * 10) / 10,
          durationHours: Math.round((Math.min(8, durationHours * 1.3)) * 10) / 10,
          solarMW: Math.round((solarMW * 1.5) * 10) / 10,
          windMW: Math.round((windMW * 1.2) * 10) / 10,
          generatorMW: 0
        }
      },
      {
        name: "Scalable Growth",
        description: "Future-proof design for expansion and maximum scale",
        config: {
          storageSizeMW: Math.round((storageSizeMW * 1.8) * 10) / 10,
          durationHours: Math.round((Math.min(12, durationHours * 1.5)) * 10) / 10,
          solarMW: Math.round((solarMW * 2.2) * 10) / 10,
          windMW: Math.round((windMW * 1.8) * 10) / 10,
          generatorMW: Math.round((generatorMW * 0.5) * 10) / 10
        }
      }
    ];

    // Calculate metrics for each sample config
    const configsWithMetrics = configs.map(config => {
      const energy = config.config.storageSizeMW * config.config.durationHours;
      const cost = (energy * 300000 + config.config.solarMW * 1200000 + 
                   config.config.windMW * 1800000 + config.config.generatorMW * 800000) * 1.3;
      
      // Base savings
      const baseSavings = energy * 300 * 200 + config.config.storageSizeMW * 1000 * 180 * 12 + 
                         config.config.solarMW * 1000 * 8760 * 0.3 * electricityRate;
      
      // Revenue potential based on profitability target
      const revenueMultiplier = profitabilityTarget / 3; // Scale factor
      const gridSalesRevenue = config.config.solarMW * 1000 * 8760 * 0.1 * revenueMultiplier;
      const arbitrageRevenue = energy * 100 * profitabilityTarget * 150; // Peak hour arbitrage
      
      const totalSavings = baseSavings + gridSalesRevenue + arbitrageRevenue;
      const payback = cost / totalSavings;
      const roi = (totalSavings / cost) * 100;

      return {
        ...config,
        metrics: {
          cost: cost / 1000000, // Convert to millions
          savings: totalSavings / 1000, // Convert to thousands
          payback,
          roi,
          revenue: (gridSalesRevenue + arbitrageRevenue) / 1000 // Revenue component in thousands
        }
      };
    });

    setSampleConfigs(configsWithMetrics);
  };

  const applyConfiguration = (config: any, configName: string) => {
    setStorageSizeMW(config.storageSizeMW);
    setDurationHours(config.durationHours);
    setSolarMW(config.solarMW);
    setWindMW(config.windMW);
    setGeneratorMW(config.generatorMW);
    
    // Set visual feedback for applied configuration
    setAppliedConfig(configName);
    
    // Reset feedback after 3 seconds
    setTimeout(() => {
      setAppliedConfig(null);
    }, 3000);
    
    // Notify parent component of the configuration change
    onConfigurationChange({
      storageSizeMW: config.storageSizeMW,
      durationHours: config.durationHours,
      solarMW: config.solarMW,
      windMW: config.windMW,
      generatorMW: config.generatorMW
    });
  };

  // Chart components (simplified for now, can be enhanced with actual chart libraries)
  const ROIChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        ROI Analysis
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Annual ROI</span>
          <span className={`text-2xl font-bold ${calculations.roiPercent > 20 ? 'text-green-600' : calculations.roiPercent > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
            {calculations.roiPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${calculations.roiPercent > 20 ? 'bg-green-500' : calculations.roiPercent > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, calculations.roiPercent * 3)}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Payback Period</span>
          <span className="text-xl font-semibold text-gray-800">{calculations.paybackYears.toFixed(1)} years</span>
        </div>
      </div>
    </div>
  );

  const CostBreakdownChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-600" />
        Cost Breakdown
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Investment</span>
          <span className="text-2xl font-bold text-gray-800">${(calculations.totalProjectCost / 1000000).toFixed(2)}M</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Annual Savings</span>
          <span className="text-xl font-semibold text-green-600">${(calculations.annualSavings / 1000).toFixed(0)}k</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${calculations.totalProjectCost <= maxBudget * 1000000 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, (calculations.totalProjectCost / (maxBudget * 1000000)) * 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          {calculations.totalProjectCost <= maxBudget * 1000000 ? 'Within budget' : 'Over budget'}
        </p>
      </div>
    </div>
  );

  const PowerChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-600" />
        Power Configuration
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Storage Capacity</span>
          <span className="text-xl font-semibold text-gray-800">{calculations.totalEnergyMWh.toFixed(1)} MWh</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Battery: {storageSizeMW}MW</span>
            <span className="text-blue-600">{((storageSizeMW / (storageSizeMW + solarMW + windMW + generatorMW)) * 100).toFixed(0)}%</span>
          </div>
          {solarMW > 0 && (
            <div className="flex justify-between text-sm">
              <span>Solar: {solarMW}MW</span>
              <span className="text-yellow-600">{((solarMW / (storageSizeMW + solarMW + windMW + generatorMW)) * 100).toFixed(0)}%</span>
            </div>
          )}
          {windMW > 0 && (
            <div className="flex justify-between text-sm">
              <span>Wind: {windMW}MW</span>
              <span className="text-green-600">{((windMW / (storageSizeMW + solarMW + windMW + generatorMW)) * 100).toFixed(0)}%</span>
            </div>
          )}
          {generatorMW > 0 && (
            <div className="flex justify-between text-sm">
              <span>Generator: {generatorMW}MW</span>
              <span className="text-red-600">{((generatorMW / (storageSizeMW + solarMW + windMW + generatorMW)) * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slider-blue::-webkit-slider-thumb {
          background: #3B82F6;
        }
        .slider-green::-webkit-slider-thumb {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .slider-yellow::-webkit-slider-thumb {
          background: #F59E0B;
        }
        .slider-teal::-webkit-slider-thumb {
          background: #14B8A6;
        }
        .slider-red::-webkit-slider-thumb {
          background: #EF4444;
        }
        .slider-purple::-webkit-slider-thumb {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border: 2px solid white;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: none;
        }
        
        /* Floating Arrow Animation */
        .floating-arrow {
          position: absolute;
          top: -10px;
          right: -10px;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          animation: bounce 1s infinite, pulse 2s infinite;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          z-index: 1000;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.8);
          }
          100% {
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
        }
        
        /* Checked item styling */
        .dashboard-item-checked {
          border: 2px solid #10b981 !important;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%) !important;
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      {/* Main Modal Container - Fixed viewport */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[98vh] flex flex-col overflow-hidden">
        
        {/* Fixed Header - Always visible at top */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Interactive Configuration Dashboard</h2>
              <p className="text-blue-100 mt-1 text-sm">Optimize your battery storage system with real-time feedback</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90">Step 4 of 5</p>
              <p className="text-blue-100 text-sm">Configure & Optimize</p>
            </div>
          </div>
        </div>

        {/* Fixed Metrics Dashboard - Always visible below header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-purple-200 p-4 flex-shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* System Size - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.systemSize ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('systemSize', 'system-config-section')}
              title="Click to adjust system size"
            >
              {clickedItems.systemSize && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">Total Power</div>
              <div className="text-lg font-bold text-purple-800">
                {(storageSizeMW + solarMW + windMW + generatorMW).toFixed(2)}MW
              </div>
              <div className="text-xs text-purple-600">
                Battery: {storageSizeMW}MW • {durationHours}hr
              </div>
            </div>

            {/* Total Investment - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.investment ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('investment', 'system-config-section')}
              title="Click to adjust budget and investment parameters"
            >
              {clickedItems.investment && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">Investment</div>
              <div className="text-lg font-bold text-blue-800">
                ${(calculations.totalProjectCost / 1000000).toFixed(1)}M
              </div>
              <div className={`text-xs ${
                calculations.totalProjectCost <= maxBudget * 1000000 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculations.totalProjectCost <= maxBudget * 1000000 
                  ? 'Within budget' : 'Over budget'}
              </div>
            </div>

            {/* Annual Revenue/Savings - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.revenue ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('revenue', 'revenue-section')}
              title="Click to adjust revenue opportunities"
            >
              {clickedItems.revenue && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">
                {solarMW > 0 ? 'Annual Revenue' : 'Annual Savings'}
              </div>
              <div className="text-lg font-bold text-green-800">
                ${(calculations.annualSavings / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-green-600">
                {profitabilityTarget >= 4 ? 'Multi-market' : profitabilityTarget >= 3 ? 'Diversified' : 'Basic'}
              </div>
            </div>

            {/* ROI - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.roi ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('roi', 'revenue-section')}
              title="Click to optimize ROI parameters"
            >
              {clickedItems.roi && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">ROI</div>
              <div className="text-lg font-bold text-emerald-800">
                {calculations.roiPercent.toFixed(0)}%
              </div>
              <div className="text-xs text-emerald-600">Annual return</div>
            </div>

            {/* Payback Period - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.payback ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('payback', 'system-config-section')}
              title="Click to adjust payback targets"
            >
              {clickedItems.payback && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">Payback</div>
              <div className="text-lg font-bold text-orange-800">
                {calculations.paybackYears.toFixed(1)}yr
              </div>
              <div className={`text-xs ${calculations.paybackYears <= targetROI ? 'text-green-600' : 'text-red-600'}`}>
                {calculations.paybackYears <= targetROI ? 'On target' : 'Exceeds target'}
              </div>
            </div>

            {/* Configuration Quality - Clickable */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200/30 cursor-pointer hover:bg-white/90 hover:shadow-lg transition-all duration-200 relative ${
                clickedItems.quality ? 'dashboard-item-checked' : ''
              }`}
              onClick={() => handleDashboardClick('quality', 'incentives-section')}
              title="Click to optimize configuration quality"
            >
              {clickedItems.quality && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-xs text-gray-600 mb-1">Quality Score</div>
              <div className="text-lg font-bold text-indigo-800">
                {(() => {
                  const score = (storageSizeMW / 50) + (profitabilityTarget / 5) + (lifetimeYears / 25);
                  return score >= 2.5 ? '95%' : score >= 2 ? '85%' : '70%';
                })()}
              </div>
              <div className={`text-xs ${(() => {
                const score = (storageSizeMW / 50) + (profitabilityTarget / 5) + (lifetimeYears / 25);
                return score >= 2.5 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';
              })()}`}>
                {(() => {
                  const score = (storageSizeMW / 50) + (profitabilityTarget / 5) + (lifetimeYears / 25);
                  return score >= 2.5 ? 'Optimized' : score >= 2 ? 'Good' : 'Basic';
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA - Everything below metrics can scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* 🎯 Live System Performance Indicator */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    System Performance Score
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Adjust bars below</span>
                  </h3>
                  <p className="text-sm text-blue-100">Real-time optimization analysis</p>
                </div>
                <div className="text-4xl font-bold">
                  {(() => {
                    const sizeScore = Math.min((storageSizeMW / 10) * 25, 25);
                    const profitScore = Math.min((profitabilityTarget / 4) * 25, 25);
                    const renewableScore = Math.min(((solarMW + windMW) / 5) * 25, 25);
                    const durationScore = Math.min((durationHours / 4) * 25, 25);
                    const totalScore = Math.round(sizeScore + profitScore + renewableScore + durationScore);
                    return `${totalScore}%`;
                  })()}
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="bg-white/20 rounded-full h-4 overflow-hidden mb-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ 
                    width: `${(() => {
                      const sizeScore = Math.min((storageSizeMW / 10) * 25, 25);
                      const profitScore = Math.min((profitabilityTarget / 4) * 25, 25);
                      const renewableScore = Math.min(((solarMW + windMW) / 5) * 25, 25);
                      const durationScore = Math.min((durationHours / 4) * 25, 25);
                      return Math.round(sizeScore + profitScore + renewableScore + durationScore);
                    })()}%` 
                  }}
                >
                  <div className="h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Interactive Score Breakdown with Sliders */}
              <div className="space-y-2 text-xs">
                {/* Size Score */}
                <div className="bg-white/10 rounded px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/80 font-medium">⚡ Size</span>
                    <span className="font-semibold">{Math.round(Math.min((storageSizeMW / 10) * 25, 25))}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={storageSizeMW}
                    onChange={(e) => setStorageSizeMW(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(storageSizeMW / 10) * 100}%, rgba(255,255,255,0.2) ${(storageSizeMW / 10) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 text-white/60 text-[10px]">
                    <span>0 MW</span>
                    <span>{storageSizeMW.toFixed(1)} MW</span>
                    <span>10 MW</span>
                  </div>
                </div>

                {/* ROI Score */}
                <div className="bg-white/10 rounded px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/80 font-medium">💰 ROI Target</span>
                    <span className="font-semibold">{Math.round(Math.min((profitabilityTarget / 4) * 25, 25))}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.5"
                    value={profitabilityTarget}
                    onChange={(e) => setProfitabilityTarget(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(profitabilityTarget / 4) * 100}%, rgba(255,255,255,0.2) ${(profitabilityTarget / 4) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 text-white/60 text-[10px]">
                    <span>Low</span>
                    <span>Level {profitabilityTarget}</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Renewable Score */}
                <div className="bg-white/10 rounded px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/80 font-medium">☀️ Renewables</span>
                    <span className="font-semibold">{Math.round(Math.min(((solarMW + windMW) / 5) * 25, 25))}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-[10px] w-10">Solar:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={solarMW}
                        onChange={(e) => setSolarMW(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(solarMW / 100) * 100}%, rgba(255,255,255,0.2) ${(solarMW / 100) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <span className="text-white/80 text-[10px] w-12">{solarMW.toFixed(1)}MW</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-[10px] w-10">Wind:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={windMW}
                        onChange={(e) => setWindMW(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${(windMW / 100) * 100}%, rgba(255,255,255,0.2) ${(windMW / 100) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <span className="text-white/80 text-[10px] w-12">{windMW.toFixed(1)}MW</span>
                    </div>
                  </div>
                </div>

                {/* Duration Score */}
                <div className="bg-white/10 rounded px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/80 font-medium">⏱️ Duration</span>
                    <span className="font-semibold">{Math.round(Math.min((durationHours / 4) * 25, 25))}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(durationHours / 4) * 100}%, rgba(255,255,255,0.2) ${(durationHours / 4) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1 text-white/60 text-[10px]">
                    <span>0 hrs</span>
                    <span>{durationHours.toFixed(1)} hrs</span>
                    <span>4 hrs</span>
                  </div>
                </div>
              </div>
              
              {/* Status Message */}
              <div className="mt-3 text-sm text-center">
                {(() => {
                  const sizeScore = Math.min((storageSizeMW / 10) * 25, 25);
                  const profitScore = Math.min((profitabilityTarget / 4) * 25, 25);
                  const renewableScore = Math.min(((solarMW + windMW) / 5) * 25, 25);
                  const durationScore = Math.min((durationHours / 4) * 25, 25);
                  const totalScore = Math.round(sizeScore + profitScore + renewableScore + durationScore);
                  
                  if (totalScore >= 90) return '🎉 Excellent! Your system is highly optimized';
                  if (totalScore >= 75) return '✅ Great configuration with strong fundamentals';
                  if (totalScore >= 60) return '👍 Good setup - consider optimizing further';
                  if (totalScore >= 40) return '⚠️ Basic config - use sliders to improve';
                  return '💡 Start by adjusting system parameters below';
                })()}
              </div>
            </div>

            {/* 🤖 AI Optimization Section */}
            {showAIInsight && aiOptimization && !aiOptimization.isOptimal && aiOptimization.suggestion && (
              <div>
                <AIInsightBadge
                  type="suggestion"
                  title="AI Optimization Available"
                  message={aiOptimization.suggestion.reasoning}
                  confidence={aiOptimization.suggestion.confidence}
                  suggestion={{
                    label: isOptimizing ? "Optimizing..." : "Apply Suggestion",
                    onAccept: handleAIOptimization
                  }}
                  className="animate-fade-in"
                />
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="bg-blue-50 rounded p-2">
                    <span className="text-gray-600">Cost Impact:</span>
                    <div className="font-semibold text-blue-900">{aiOptimization.suggestion.costImpact}</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <span className="text-gray-600">ROI Impact:</span>
                    <div className="font-semibold text-green-900">{aiOptimization.suggestion.roiImpact}</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Optimal Configuration Badge */}
            {aiOptimization?.isOptimal && (
              <div>
                <AIInsightBadge
                  type="optimal"
                  title="✓ Optimal Configuration"
                  message={`Your ${storageSizeMW}MW / ${durationHours}hr configuration is well-optimized for ${industryTemplate}. ${aiOptimization.benchmarkComparison ? aiOptimization.benchmarkComparison.comparison : ''}`}
                />
              </div>
            )}

            {/* Equipment Configuration Summary */}
            {(solarSpaceConfig || evChargerConfig || windConfig || generatorConfig) && (
              <div>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    ⚡ Power Generation Equipment
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Solar Configuration */}
                    {solarMW > 0 && solarSpaceConfig && (
                      <div className="bg-white/70 rounded-lg p-2 border border-yellow-200">
                        <div className="font-semibold text-yellow-700">☀️ Solar</div>
                        <div className="text-gray-700">{solarMW.toFixed(1)} MW</div>
                        <div className="text-gray-600">
                          {solarSpaceConfig.spaceType === 'rooftop' ? '🏢 Rooftop' :
                           solarSpaceConfig.spaceType === 'ground' ? '🌱 Ground' :
                           solarSpaceConfig.spaceType === 'canopy' ? '🚗 Canopy' : '🔄 Mixed'}
                        </div>
                        {solarSpaceConfig.rooftopSqFt && (
                          <div className="text-gray-500">{solarSpaceConfig.rooftopSqFt.toLocaleString()} sq ft</div>
                        )}
                        {solarSpaceConfig.groundAcres && (
                          <div className="text-gray-500">{solarSpaceConfig.groundAcres} acres</div>
                        )}
                      </div>
                    )}
                
                    {/* Wind Configuration */}
                    {windMW > 0 && windConfig && (
                      <div className="bg-white/70 rounded-lg p-2 border border-cyan-200">
                        <div className="font-semibold text-cyan-700">💨 Wind</div>
                        <div className="text-gray-700">{windMW.toFixed(1)} MW</div>
                        <div className="text-gray-600">
                          {Math.ceil(windMW / parseFloat(windConfig.turbineSize))} × {windConfig.turbineSize} MW
                        </div>
                        <div className="text-gray-500">turbines</div>
                      </div>
                    )}
                    
                    {/* Generator Configuration */}
                    {generatorMW > 0 && generatorConfig && (
                      <div className="bg-white/70 rounded-lg p-2 border border-orange-200">
                        <div className="font-semibold text-orange-700">⚡ Generator</div>
                        <div className="text-gray-700">{generatorMW.toFixed(1)} MW</div>
                        <div className="text-gray-600">
                          {Math.ceil(generatorMW / generatorConfig.sizePerUnit)} × {generatorConfig.sizePerUnit} MW
                        </div>
                        <div className="text-gray-500 capitalize">
                          {generatorConfig.generatorType.replace('-', ' ')}
                        </div>
                      </div>
                    )}
                    
                    {/* EV Charger Configuration */}
                    {evChargerConfig && Object.values(evChargerConfig).some(v => v > 0) && (
                      <div className="bg-white/70 rounded-lg p-2 border border-blue-200">
                        <div className="font-semibold text-blue-700">🔌 EV Chargers</div>
                        <div className="text-gray-700">
                          {Object.values(evChargerConfig).reduce((a, b) => a + b, 0)} units
                        </div>
                        <div className="text-gray-600 space-y-0.5">
                          {evChargerConfig.level2_11kw > 0 && <div>L2-11kW: {evChargerConfig.level2_11kw}</div>}
                          {evChargerConfig.level2_19kw > 0 && <div>L2-19kW: {evChargerConfig.level2_19kw}</div>}
                          {evChargerConfig.dcfast_50kw > 0 && <div>DC-50kW: {evChargerConfig.dcfast_50kw}</div>}
                          {evChargerConfig.dcfast_150kw > 0 && <div>DC-150kW: {evChargerConfig.dcfast_150kw}</div>}
                          {evChargerConfig.dcfast_350kw > 0 && <div>DC-350kW: {evChargerConfig.dcfast_350kw}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Panels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Left Panel - Configuration Controls */}
              <div className="space-y-3">
                <div id="system-config-section" className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 relative">
                  {activeArrow === 'system-config-section' && (
                    <div className="floating-arrow">
                      🎯
                    </div>
                  )}
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  System Configuration
                </h3>

                {/* AI Optimization Button */}
                {aiOptimization && !aiOptimization.isOptimal && aiOptimization.suggestion && (
                  <div className="mb-3">
                    <AIOptimizationButton
                      onOptimize={handleAIOptimization}
                      isLoading={isOptimizing}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Storage Size */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Battery Storage Power: {storageSizeMW} MW
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={storageSizeMW}
                      onChange={(e) => setStorageSizeMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0.5 MW</span>
                      <span>20 MW</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Duration: {durationHours} hours
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="0.5"
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>1 hr</span>
                      <span>12 hrs</span>
                    </div>
                  </div>

                  {/* Solar */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Solar Power: {solarMW} MW
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={solarMW}
                      onChange={(e) => setSolarMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>100 MW</span>
                    </div>
                  </div>

                  {/* Wind */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Wind Power: {windMW} MW
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={windMW}
                      onChange={(e) => setWindMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>100 MW</span>
                    </div>
                  </div>

                  {/* Generator */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Backup Generator: {generatorMW} MW
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={generatorMW}
                      onChange={(e) => setGeneratorMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>100 MW</span>
                    </div>
                  </div>

                  {/* Grid Connectivity */}
                  <div className="pt-4 border-t border-purple-200">
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Grid Connection: {gridConnectivity === 0 ? 'Off-Grid' : 
                                     gridConnectivity < 0.3 ? 'Mostly Off-Grid' :
                                     gridConnectivity < 0.7 ? 'Hybrid' :
                                     gridConnectivity < 1 ? 'Mostly On-Grid' : 'Fully On-Grid'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={gridConnectivity}
                      onChange={(e) => setGridConnectivity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Off-Grid</span>
                      <span>On-Grid</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {gridConnectivity === 0 && 'Independent system with backup generators'}
                      {gridConnectivity > 0 && gridConnectivity < 0.3 && 'Limited grid tie for emergency backup'}
                      {gridConnectivity >= 0.3 && gridConnectivity < 0.7 && 'Balanced grid interaction with autonomy'}
                      {gridConnectivity >= 0.7 && gridConnectivity < 1 && 'Primary grid connection with storage backup'}
                      {gridConnectivity === 1 && 'Full grid integration with net metering'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Targets */}
              {/* Financial Targets */}
              <div className="bg-gradient-to-br from-purple-100/70 to-purple-200/50 backdrop-blur-sm border border-purple-200/30 p-4 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Targets
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Target ROI: {targetROI} years payback
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="0.5"
                      value={targetROI}
                      onChange={(e) => setTargetROI(parseFloat(e.target.value))}
                      className="w-full h-3 bg-purple-200/50 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Max Budget: ${maxBudget}M
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="1"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                      className="w-full h-3 bg-purple-200/50 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Min Annual Savings: ${(minSavings / 1000).toFixed(0)}k
                    </label>
                    <input
                      type="range"
                      min="100000"
                      max="2000000"
                      step="50000"
                      value={minSavings}
                      onChange={(e) => setMinSavings(parseFloat(e.target.value))}
                      className="w-full h-3 bg-purple-200/50 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>
                </div>
              </div>

              {/* Revenue Opportunities */}
              <div id="revenue-section" className="bg-gradient-to-br from-green-100/70 to-emerald-200/50 backdrop-blur-sm border border-green-200/30 p-4 rounded-xl shadow-lg relative">
                {activeArrow === 'revenue-section' && (
                  <div className="floating-arrow">
                    💰
                  </div>
                )}
                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Revenue Opportunities
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Profitability Focus: {
                        profitabilityTarget === 1 ? 'Save Only' :
                        profitabilityTarget === 2 ? 'Basic Arbitrage' :
                        profitabilityTarget === 3 ? 'Grid Sales' :
                        profitabilityTarget === 4 ? 'Peak Trading' :
                        'Max Revenue'
                      }
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={profitabilityTarget}
                      onChange={(e) => setProfitabilityTarget(parseFloat(e.target.value))}
                      className="w-full h-3 bg-green-200/50 rounded-lg appearance-none cursor-pointer slider-green"
                    />
                    <div className="text-xs text-green-600 mt-2">
                      {profitabilityTarget === 1 && 'Focus on cost savings only'}
                      {profitabilityTarget === 2 && 'Basic time-of-use arbitrage + demand charges'}
                      {profitabilityTarget === 3 && 'Energy arbitrage + grid sales + frequency regulation'}
                      {profitabilityTarget === 4 && 'Peak trading + ancillary services + capacity markets'}
                      {profitabilityTarget === 5 && 'Full revenue stack: arbitrage + grid services + capacity + ancillary'}
                    </div>
                  </div>

                  <div className="bg-white/30 p-3 rounded-lg">
                    <div className="text-sm text-green-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Peak Shaving / Arbitrage:</span>
                        <span className="font-bold">
                          ${((calculations.peakShavingSavings) / 1000).toFixed(0)}k/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Demand Charge Reduction:</span>
                        <span>${((calculations.demandChargeSavings) / 1000).toFixed(0)}k/yr</span>
                      </div>
                      {calculations.gridServiceRevenue > 0 && (
                        <div className="flex justify-between">
                          <span>Grid Services Revenue:</span>
                          <span>${((calculations.gridServiceRevenue) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      {calculations.solarSavings > 0 && (
                        <div className="flex justify-between">
                          <span>Solar Energy Sales:</span>
                          <span>${((calculations.solarSavings) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      {calculations.windSavings > 0 && (
                        <div className="flex justify-between">
                          <span>Wind Energy Sales:</span>
                          <span>${((calculations.windSavings) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      <div className="border-t border-green-200 pt-1 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Annual {solarMW > 0 || windMW > 0 ? 'Revenue' : 'Savings'}:</span>
                          <span className="text-green-800">
                            ${((calculations.annualSavings) / 1000).toFixed(0)}k/yr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incentives and Credits */}
              <div id="incentives-section" className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 p-4 rounded-xl shadow-lg relative">
                {activeArrow === 'incentives-section' && (
                  <div className="floating-arrow">
                    🎯
                  </div>
                )}
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Incentives & Credits
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Available Incentives: {
                        incentivesLevel === 1 ? 'Minimal' :
                        incentivesLevel === 2 ? 'Basic Tax Credits' :
                        incentivesLevel === 3 ? 'Standard Package' :
                        incentivesLevel === 4 ? 'Enhanced Rebates' :
                        'Maximum Benefits'
                      }
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={incentivesLevel}
                      onChange={(e) => setIncentivesLevel(parseFloat(e.target.value))}
                      className="w-full h-3 bg-purple-200/50 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                    <div className="text-xs text-purple-600 mt-2">
                      {incentivesLevel === 1 && 'Basic federal tax credit (30%)'}
                      {incentivesLevel === 2 && 'Federal + state tax credits (40%)'}
                      {incentivesLevel === 3 && 'Tax credits + utility rebates (50%)'}
                      {incentivesLevel === 4 && 'Full rebate package + grants (60%)'}
                      {incentivesLevel === 5 && 'Maximum available benefits (70%)'}
                    </div>
                  </div>

                  <div className="bg-white/30 p-3 rounded-lg">
                    <div className="text-sm text-purple-700">
                      <div className="flex justify-between">
                        <span>Total Incentive Value:</span>
                        <span className="font-bold">
                          ${((calculations.totalProjectCost * (0.2 + incentivesLevel * 0.1)) / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Net Project Cost:</span>
                        <span className="font-bold text-purple-800">
                          ${((calculations.totalProjectCost * (1 - (0.2 + incentivesLevel * 0.1))) / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Effective Savings:</span>
                        <span className="font-bold text-green-600">
                          {((0.2 + incentivesLevel * 0.1) * 100).toFixed(0)}% reduction
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifetime Value */}
              <div className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Investment Lifetime Value
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Investment Timeline: {lifetimeYears} years
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="5"
                      value={lifetimeYears}
                      onChange={(e) => setLifetimeYears(parseFloat(e.target.value))}
                      className="w-full h-3 bg-purple-200/50 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>10 years</span>
                      <span>40 years</span>
                    </div>
                  </div>

                  <div className="bg-white/30 p-3 rounded-lg">
                    <div className="text-sm text-purple-700 space-y-1">
                      {/* Enhanced revenue calculation with multiple streams */}
                      {(() => {
                        const energyArbitrage = storageSizeMW * durationHours * 50 * profitabilityTarget;
                        const gridSales = profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0;
                        const ancillaryServices = profitabilityTarget >= 4 ? storageSizeMW * 120 * profitabilityTarget : 0;
                        const frequencyReg = profitabilityTarget >= 4 ? storageSizeMW * 80 * profitabilityTarget : 0;
                        const capacityMarkets = profitabilityTarget >= 5 ? storageSizeMW * 60 * profitabilityTarget : 0;
                        const totalAnnualRevenue = energyArbitrage + gridSales + ancillaryServices + frequencyReg + capacityMarkets;
                        
                        // Battery health optimization (inspired by GreenVoltis SOC management)
                        const cyclesPerYear = (profitabilityTarget * 200); // More aggressive trading = more cycles
                        const depthOfDischarge = Math.min(0.9, 0.6 + (profitabilityTarget * 0.06)); // Higher profitability = deeper DOD
                        const batteryDegradation = Math.pow(0.98, lifetimeYears); // 2% annual degradation
                        const healthOptimizedRevenue = totalAnnualRevenue * batteryDegradation;
                        
                        const lifetimeSavings = (minSavings + healthOptimizedRevenue) * lifetimeYears;
                        const netProjectCost = calculations.totalProjectCost * (1 - (0.2 + incentivesLevel * 0.1));
                        const netValue = lifetimeSavings - netProjectCost;
                        const roi = (lifetimeSavings / netProjectCost) * 100;
                        const payback = netProjectCost / (minSavings + healthOptimizedRevenue);
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Annual Revenue (Health-Optimized):</span>
                              <span className="font-bold">
                                ${(healthOptimizedRevenue / 1000).toFixed(0)}k/yr
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Battery Health Factor:</span>
                              <span className="font-bold text-blue-600">
                                {(batteryDegradation * 100).toFixed(0)}% @ year {lifetimeYears}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>SOC Management Strategy:</span>
                              <span className="text-xs text-purple-600">
                                {depthOfDischarge <= 0.7 ? 'Conservative' : depthOfDischarge <= 0.8 ? 'Balanced' : 'Aggressive'} cycling
                              </span>
                            </div>
                            <div className="border-t border-purple-200 pt-1 mt-2">
                              <div className="flex justify-between">
                                <span>Total Lifetime Value:</span>
                                <span className="font-bold">
                                  ${(lifetimeSavings / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Net Project Value:</span>
                                <span className="font-bold text-purple-800">
                                  ${(netValue / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Health-Optimized ROI:</span>
                                <span className="font-bold text-green-600">
                                  {roi.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Payback Period:</span>
                                <span className="font-bold text-blue-600">
                                  {payback.toFixed(1)} years
                                </span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-gradient-to-br from-emerald-100/70 to-green-200/50 backdrop-blur-sm border border-emerald-200/30 p-4 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  🌱 Environmental Impact
                </h3>
                
                {/* Competitive Intelligence inspired by GreenVoltis */}
                <div className="bg-gradient-to-r from-purple-50/70 to-indigo-100/50 p-3 rounded-lg border border-purple-200/30 mb-3">
                  <div className="text-sm font-medium text-purple-800 mb-2">AI Optimization Intelligence:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Configuration Quality:</span>
                      <span className={`font-bold ${
                        (() => {
                          const score = (storageSizeMW / 50) + (profitabilityTarget / 5) + (lifetimeYears / 25);
                          return score >= 2.5 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-600';
                        })()
                      }`}>
                        {(() => {
                          const score = (storageSizeMW / 50) + (profitabilityTarget / 5) + (lifetimeYears / 25);
                          return score >= 2.5 ? '95%+' : score >= 2 ? '80-94%' : '60-79%';
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Position:</span>
                      <span className="font-bold text-purple-600">
                        {(() => {
                          const score = (profitabilityTarget * 20) + (incentivesLevel * 15) + ((lifetimeYears - 10) * 2);
                          return score >= 80 ? 'Industry Leader' : score >= 60 ? 'Competitive' : 'Standard';
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Diversification:</span>
                      <span className="font-bold text-indigo-600">
                        {profitabilityTarget >= 5 ? '5 Streams' : 
                         profitabilityTarget >= 4 ? '4 Streams' : 
                         profitabilityTarget >= 3 ? '3 Streams' : '2 Streams'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/30 p-4 rounded-lg">
                    <div className="text-sm text-emerald-700 space-y-2">
                      <div className="flex justify-between">
                        <span>CO₂ Avoided Annually:</span>
                        <span className="font-bold text-emerald-800">
                          {((storageSizeMW * durationHours * 365 + solarMW * 1000 * 8760 * 0.4) * 0.0004).toFixed(1)} tons
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Renewable Energy:</span>
                        <span className="font-bold text-emerald-800">
                          {(((solarMW + windMW) / (storageSizeMW + solarMW + windMW + generatorMW)) * 100).toFixed(0)}% clean
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Grid Independence:</span>
                        <span className="font-bold text-emerald-800">
                          {((storageSizeMW * durationHours) / (storageSizeMW * 8) * 100).toFixed(0)}% self-sufficient
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-emerald-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {((storageSizeMW * durationHours * 365 + solarMW * 1000 * 8760 * 0.4) * 0.0004 / 15).toFixed(1)}
                          </div>
                          <div className="text-xs text-emerald-600">Cars off road equivalent</div>
                        </div>
                      </div>
                      
                      {/* Performance Benchmarking inspired by GreenVoltis */}
                      <div className="mt-3 pt-2 border-t border-emerald-200">
                        <div className="text-xs text-emerald-700 font-medium mb-2">Performance vs Industry Benchmarks:</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Revenue Optimization:</span>
                            <span className={`font-bold ${
                              profitabilityTarget >= 4 ? 'text-green-600' : 
                              profitabilityTarget >= 3 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {profitabilityTarget >= 4 ? 'Advanced' : 
                               profitabilityTarget >= 3 ? 'Competitive' : 'Basic'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Battery Health Strategy:</span>
                            <span className="font-bold text-blue-600">
                              {lifetimeYears >= 25 ? 'Optimized' : lifetimeYears >= 20 ? 'Standard' : 'Conservative'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Market Position:</span>
                            <span className="font-bold text-emerald-600">
                              {(() => {
                                const score = (profitabilityTarget * 20) + (incentivesLevel * 15) + ((lifetimeYears - 10) * 2);
                                return score >= 80 ? 'Leader' : score >= 60 ? 'Competitive' : 'Standard';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Panel - Real-time Charts */}
            <div className="space-y-6 overflow-y-auto">
              <ROIChart />
              
              {/* Cash Flow Analysis - New Financial Metric */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Cash Flow Analysis
                </h3>
                <div className="space-y-4">
                  {/* Net Present Value */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-indigo-700">Net Present Value (NPV)</span>
                      <span className="text-2xl font-bold text-indigo-800">
                        ${(() => {
                          const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                          const arbitrage = storageSizeMW * durationHours * 50 * profitabilityTarget;
                          const gridSales = profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0;
                          const annualCashFlow = arbitrage + gridSales;
                          
                          // NPV calculation with 8% discount rate over 20 years
                          let npv = -totalCost;
                          const discountRate = 0.08;
                          for (let year = 1; year <= 20; year++) {
                            const degradationFactor = Math.pow(0.98, year - 1);
                            const yearlyFlow = annualCashFlow * degradationFactor;
                            npv += yearlyFlow / Math.pow(1 + discountRate, year);
                          }
                          return (npv / 1000000).toFixed(1);
                        })()}M
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 bg-green-500"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      Project creates significant value over lifetime
                    </p>
                  </div>

                  {/* Internal Rate of Return */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-purple-700">Internal Rate of Return (IRR)</span>
                      <span className="text-2xl font-bold text-purple-800">
                        {(() => {
                          const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                          const arbitrage = storageSizeMW * durationHours * 50 * profitabilityTarget;
                          const gridSales = profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0;
                          const annualCashFlow = arbitrage + gridSales;
                          
                          // Simplified IRR approximation
                          const avgAnnualReturn = (annualCashFlow * 0.98) / totalCost;
                          const irr = avgAnnualReturn * 100;
                          return irr.toFixed(1);
                        })()}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 bg-green-500"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Strong investment return potential
                    </p>
                  </div>

                  {/* Monthly Cash Flow */}
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-emerald-700">Monthly Cash Flow</span>
                      <span className="text-2xl font-bold text-emerald-800">
                        ${(() => {
                          const arbitrage = storageSizeMW * durationHours * 50 * profitabilityTarget;
                          const gridSales = profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0;
                          const ancillary = profitabilityTarget >= 4 ? storageSizeMW * 120 * profitabilityTarget : 0;
                          const monthlyCashFlow = (arbitrage + gridSales + ancillary) / 12;
                          return (monthlyCashFlow / 1000).toFixed(0);
                        })()}k
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-emerald-700">Revenue</div>
                        <div className="text-emerald-600">
                          ${(() => {
                            const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) / 12;
                            return (revenue / 1000).toFixed(0);
                          })()}k
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-emerald-700">O&M Costs</div>
                        <div className="text-red-600">
                          -${((storageSizeMW * 2000) / 12 / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-emerald-700">Net Flow</div>
                        <div className="text-emerald-800 font-bold">
                          ${(() => {
                            const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) / 12;
                            const costs = (storageSizeMW * 2000) / 12;
                            return ((revenue - costs) / 1000).toFixed(0);
                          })()}k
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <CostBreakdownChart />
              <PowerChart />
            </div>

            {/* Right Panel - Sample Configurations */}
            <div className="space-y-6 overflow-y-auto">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recommended Configurations</h3>
                
                <div className="space-y-4">
                  {sampleConfigs.map((config, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{config.name}</h4>
                        <span className={`text-sm px-2 py-1 rounded ${
                          config.metrics.payback <= targetROI ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {config.metrics.payback.toFixed(1)}y ROI
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                        <div>Cost: ${config.metrics.cost.toFixed(1)}M</div>
                        <div>Savings: ${config.metrics.savings.toFixed(0)}k/yr</div>
                        <div>Storage: {config.config.storageSizeMW.toFixed(1)}MW</div>
                        <div>Solar: {config.config.solarMW.toFixed(1)}MW</div>
                        <div className="col-span-2 text-green-600 font-medium">
                          ROI: {config.metrics.roi.toFixed(1)}% annually
                        </div>
                      </div>
                      
                      <button
                        onClick={() => applyConfiguration(config.config, config.name)}
                        className={`w-full text-sm py-2 px-3 rounded transition-colors ${
                          appliedConfig === config.name 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                        }`}
                      >
                        {appliedConfig === config.name ? 'Configuration Applied ✓' : 'Apply Configuration'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div> {/* End of 3-column grid */}
          </div> {/* End of scrollable content padding */}
        </div> {/* End of scrollable content area */}

        {/* Footer - Fixed at bottom - Only show if navigation callbacks provided */}
        {(onBack || onContinue) && (
          <div className="bg-gray-50 p-3 border-t flex-shrink-0">
            <div className="flex justify-between items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              <div className="text-center flex-1">
                <p className="text-xs text-gray-600">
                  Current Configuration: {storageSizeMW}MW / {durationHours}h • ${(calculations.totalProjectCost / 1000000).toFixed(2)}M • {calculations.paybackYears.toFixed(1)}y ROI
                </p>
              </div>
              
              {onContinue && (
                <button
                  onClick={onContinue}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {continueButtonText}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default InteractiveConfigDashboard;