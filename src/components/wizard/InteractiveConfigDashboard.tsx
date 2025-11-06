import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Zap, DollarSign, TrendingUp, Settings } from 'lucide-react';

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
  industryTemplate: string;
  location: string;
  electricityRate: number;
  onConfigurationChange: (config: {
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
  }) => void;
  onBack: () => void;
  onContinue: () => void;
}

const InteractiveConfigDashboard: React.FC<InteractiveConfigDashboardProps> = ({
  initialStorageSizeMW,
  initialDurationHours,
  initialSolarMW,
  industryTemplate,
  location,
  electricityRate,
  onConfigurationChange,
  onBack,
  onContinue
}) => {
  // Configuration state
  const [storageSizeMW, setStorageSizeMW] = useState(initialStorageSizeMW);
  const [durationHours, setDurationHours] = useState(initialDurationHours);
  const [solarMW, setSolarMW] = useState(initialSolarMW);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);
  
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
    carbonOffset: 0
  });

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
    const totalEnergyMWh = storageSizeMW * durationHours;
    
    // Simplified cost calculations for real-time feedback
    const batteryCostPerMWh = 300000; // $300k per MWh
    const solarCostPerMW = 1200000; // $1.2M per MW
    const windCostPerMW = 1800000; // $1.8M per MW
    const generatorCostPerMW = 800000; // $800k per MW
    
    const batteryCost = totalEnergyMWh * batteryCostPerMWh;
    const solarCost = solarMW * solarCostPerMW;
    const windCost = windMW * windCostPerMW;
    const generatorCost = generatorMW * generatorCostPerMW;
    const installationMultiplier = 1.3; // 30% installation costs
    
    const totalProjectCost = (batteryCost + solarCost + windCost + generatorCost) * installationMultiplier;
    
    // Annual savings calculation
    const energyArbitrage = totalEnergyMWh * 300 * 200; // 300 cycles/year, $200/MWh spread
    const demandChargeReduction = storageSizeMW * 1000 * 180 * 12; // $180/kW-month
    const solarSavings = solarMW * 1000 * 8760 * 0.3 * electricityRate; // 30% capacity factor
    const annualSavings = energyArbitrage + demandChargeReduction + solarSavings;
    
    const paybackYears = totalProjectCost / annualSavings;
    const roiPercent = (annualSavings / totalProjectCost) * 100;
    const carbonOffset = (totalEnergyMWh * 0.4 + solarMW * 1000 * 8760 * 0.3 * 0.0004) * 365; // tons CO2/year
    
    setCalculations({
      totalEnergyMWh,
      totalProjectCost,
      annualSavings,
      paybackYears,
      roiPercent,
      carbonOffset
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
  }, [storageSizeMW, durationHours, solarMW, windMW, generatorMW, targetROI, maxBudget, minSavings, profitabilityTarget]);

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
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
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

        {/* Configuration Summary Dashboard */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-purple-200 p-4">
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
              <div className="text-xs text-gray-600 mb-1">System Size</div>
              <div className="text-lg font-bold text-purple-800">{storageSizeMW}MW</div>
              <div className="text-xs text-purple-600">{durationHours}hr duration</div>
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
                ${((storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000) / 1000000).toFixed(1)}M
              </div>
              <div className={`text-xs ${
                (storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000) <= maxBudget * 1000000 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {(storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000) <= maxBudget * 1000000 
                  ? 'Within budget' : 'Over budget'}
              </div>
            </div>

            {/* Annual Revenue - Clickable */}
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
              <div className="text-xs text-gray-600 mb-1">Annual Revenue</div>
              <div className="text-lg font-bold text-green-800">
                ${(((storageSizeMW * durationHours * 50 * profitabilityTarget) + 
                    (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0)) / 1000).toFixed(0)}k
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
                {(() => {
                  const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                  const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) + 
                    (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0);
                  return ((revenue / totalCost) * 100).toFixed(0);
                })()}%
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
                {(() => {
                  const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                  const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) + 
                    (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0);
                  return (totalCost / revenue).toFixed(1);
                })()}yr
              </div>
              <div className={`text-xs ${(() => {
                const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) + 
                  (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0);
                const payback = totalCost / revenue;
                return payback <= targetROI ? 'text-green-600' : 'text-red-600';
              })()}`}>
                {(() => {
                  const totalCost = storageSizeMW * durationHours * 300000 + solarMW * 1200000 + windMW * 1500000 + generatorMW * 800000;
                  const revenue = (storageSizeMW * durationHours * 50 * profitabilityTarget) + 
                    (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0);
                  const payback = totalCost / revenue;
                  return payback <= targetROI ? 'On target' : 'Exceeds target';
                })()}
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

        <div className="flex-1 overflow-hidden p-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            
            {/* Left Panel - Configuration Controls */}
            <div className="space-y-3 overflow-y-auto">
              <div id="system-config-section" className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 relative">
                {activeArrow === 'system-config-section' && (
                  <div className="floating-arrow">
                    👆
                  </div>
                )}
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  System Configuration
                </h3>
                
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
                      max="30"
                      step="0.5"
                      value={solarMW}
                      onChange={(e) => setSolarMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>30 MW</span>
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
                      max="25"
                      step="0.5"
                      value={windMW}
                      onChange={(e) => setWindMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>25 MW</span>
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
                      max="15"
                      step="0.5"
                      value={generatorMW}
                      onChange={(e) => setGeneratorMW(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-purple-700 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>0 MW</span>
                      <span>15 MW</span>
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
                        <span>Energy Arbitrage:</span>
                        <span className="font-bold">
                          ${((storageSizeMW * durationHours * 50 * profitabilityTarget) / 1000).toFixed(0)}k/yr
                        </span>
                      </div>
                      {profitabilityTarget >= 3 && (
                        <div className="flex justify-between">
                          <span>Grid Sales Income:</span>
                          <span>${((solarMW * 1000 * 8760 * 0.08 * profitabilityTarget) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      {profitabilityTarget >= 4 && (
                        <div className="flex justify-between">
                          <span>Ancillary Services:</span>
                          <span>${((storageSizeMW * 120 * profitabilityTarget) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      {profitabilityTarget >= 4 && (
                        <div className="flex justify-between">
                          <span>Frequency Regulation:</span>
                          <span>${((storageSizeMW * 80 * profitabilityTarget) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      {profitabilityTarget >= 5 && (
                        <div className="flex justify-between">
                          <span>Capacity Markets:</span>
                          <span>${((storageSizeMW * 60 * profitabilityTarget) / 1000).toFixed(0)}k/yr</span>
                        </div>
                      )}
                      <div className="border-t border-green-200 pt-1 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Annual Revenue:</span>
                          <span className="text-green-800">
                            ${((
                              (storageSizeMW * durationHours * 50 * profitabilityTarget) + // Arbitrage
                              (profitabilityTarget >= 3 ? solarMW * 1000 * 8760 * 0.08 * profitabilityTarget : 0) + // Grid sales
                              (profitabilityTarget >= 4 ? storageSizeMW * 120 * profitabilityTarget : 0) + // Ancillary
                              (profitabilityTarget >= 4 ? storageSizeMW * 80 * profitabilityTarget : 0) + // Frequency reg
                              (profitabilityTarget >= 5 ? storageSizeMW * 60 * profitabilityTarget : 0) // Capacity
                            ) / 1000).toFixed(0)}k/yr
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
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 border-t">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Current Configuration: {storageSizeMW}MW / {durationHours}h • ${(calculations.totalProjectCost / 1000000).toFixed(2)}M • {calculations.paybackYears.toFixed(1)}y ROI
              </p>
            </div>
            
            <button
              onClick={onContinue}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              Continue to Location & Pricing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InteractiveConfigDashboard;