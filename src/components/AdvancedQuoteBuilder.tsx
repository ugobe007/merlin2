import React, { useState, useEffect } from 'react';
import { X, Wrench, Zap, Calculator, TrendingUp, Package, FileText, ArrowLeft, Building2, MapPin, DollarSign, Battery, Calendar, Sparkles, Cpu, GitBranch } from 'lucide-react';

/**
 * ADVANCED QUOTE BUILDER - MERLIN EDITION
 * 
 * Enhanced custom BESS configuration with Merlin's magical theme
 * Includes detailed electrical specifications for professional quotes
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
}

type ViewMode = 'landing' | 'custom-config';

export default function AdvancedQuoteBuilder({
  show,
  onClose,
  onOpenSmartWizard,
  onOpenFinancing,
  onOpenMarketIntel,
  onOpenQuoteTemplates,
  setSkipWizardIntro,
  storageSizeMW,
  durationHours,
  systemCost,
  onStorageSizeChange,
  onDurationChange,
  onSystemCostChange,
  onGenerateQuote,
}: AdvancedQuoteBuilderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  // Extended configuration state
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [applicationType, setApplicationType] = useState('commercial');
  const [useCase, setUseCase] = useState('peak-shaving');
  const [chemistry, setChemistry] = useState('lfp');
  const [roundTripEfficiency, setRoundTripEfficiency] = useState(90);
  const [warrantyYears, setWarrantyYears] = useState(10);
  const [cyclesPerYear, setCyclesPerYear] = useState(365);
  const [utilityRate, setUtilityRate] = useState(0.12);
  const [demandCharge, setDemandCharge] = useState(15);
  const [installationType, setInstallationType] = useState('outdoor');
  const [gridConnection, setGridConnection] = useState('ac-coupled');
  const [inverterEfficiency, setInverterEfficiency] = useState(96);
  
  // NEW: Electrical Specifications
  const [systemVoltage, setSystemVoltage] = useState(480); // Volts AC
  const [dcVoltage, setDcVoltage] = useState(1000); // Volts DC
  const [inverterType, setInverterType] = useState('string');
  const [inverterManufacturer, setInverterManufacturer] = useState('');
  const [inverterRating, setInverterRating] = useState(2500); // kW per inverter
  const [switchgearType, setSwitchgearType] = useState('medium-voltage');
  const [switchgearRating, setSwitchgearRating] = useState(5000); // Amps
  const [bmsType, setBmsType] = useState('distributed');
  const [bmsManufacturer, setBmsManufacturer] = useState('');
  const [transformerRequired, setTransformerRequired] = useState(true);
  const [transformerRating, setTransformerRating] = useState(3000); // kVA
  const [transformerVoltage, setTransformerVoltage] = useState('480V/12470V');
  
  // NEW: Renewables & Alternative Power
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarPVIncluded, setSolarPVIncluded] = useState(false);
  const [solarCapacityKW, setSolarCapacityKW] = useState(1000);
  const [solarPanelType, setSolarPanelType] = useState('monocrystalline');
  const [solarPanelEfficiency, setSolarPanelEfficiency] = useState(21);
  const [solarInverterType, setSolarInverterType] = useState('string');
  const [windTurbineIncluded, setWindTurbineIncluded] = useState(false);
  const [windCapacityKW, setWindCapacityKW] = useState(500);
  const [windTurbineType, setWindTurbineType] = useState('horizontal');
  const [fuelCellIncluded, setFuelCellIncluded] = useState(false);
  const [fuelCellCapacityKW, setFuelCellCapacityKW] = useState(250);
  const [fuelCellType, setFuelCellType] = useState('pem');
  const [fuelType, setFuelType] = useState('hydrogen');
  const [dieselGenIncluded, setDieselGenIncluded] = useState(false);
  const [dieselGenCapacityKW, setDieselGenCapacityKW] = useState(500);
  const [naturalGasGenIncluded, setNaturalGasGenIncluded] = useState(false);
  const [naturalGasCapacityKW, setNaturalGasCapacityKW] = useState(750);

  // Calculated values
  const storageSizeMWh = storageSizeMW * durationHours;
  const totalWatts = storageSizeMW * 1000000; // Convert MW to W
  const totalKW = storageSizeMW * 1000; // Convert MW to kW
  const maxAmpsAC = (totalWatts / systemVoltage) / Math.sqrt(3); // 3-phase AC
  const maxAmpsDC = (totalWatts / dcVoltage);
  const numberOfInverters = Math.ceil(totalKW / inverterRating);
  const requiredTransformerKVA = totalKW * 1.25; // 25% safety factor
  useEffect(() => {
    if (show) {
      setViewMode('landing');
      window.scrollTo(0, 0);
    }
  }, [show]);

  if (!show) return null;

  // Tool cards configuration
  const tools = [
    {
      id: 'custom-config',
      icon: <Wrench className="w-8 h-8" />,
      title: 'Custom Configuration',
      description: 'Complete BESS design with electrical specs, renewables, and detailed system parameters',
      color: 'from-blue-500 to-cyan-500',
      action: () => setViewMode('custom-config'),
    },
    {
      id: 'ai-optimization',
      icon: <Zap className="w-8 h-8" />,
      title: 'AI Optimization',
      description: 'Let our AI suggest the optimal system configuration for your use case',
      color: 'from-purple-500 to-pink-500',
      action: () => {
        // Set flag to skip intro and go directly to step 0 (Industry Template)
        if (setSkipWizardIntro) {
          setSkipWizardIntro(true);
        }
        onClose();
        onOpenSmartWizard?.();
      },
    },
    {
      id: 'financial-calculator',
      icon: <Calculator className="w-8 h-8" />,
      title: 'Financial Calculator',
      description: 'Calculate ROI, payback period, and financing options',
      color: 'from-green-500 to-emerald-500',
      action: () => {
        onClose();
        onOpenFinancing?.();
      },
    },
    {
      id: 'market-analytics',
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Market Analytics',
      description: 'View market trends, pricing intelligence, and competitive analysis',
      color: 'from-orange-500 to-red-500',
      action: () => {
        onClose();
        onOpenMarketIntel?.();
      },
    },
    {
      id: 'component-library',
      icon: <Package className="w-8 h-8" />,
      title: 'Component Library',
      description: 'Browse available batteries, inverters, and balance of system equipment',
      color: 'from-indigo-500 to-purple-500',
      action: () => {
        alert('🔧 Component Library\n\nBrowse batteries, solar panels, inverters, and BOS equipment.\n\nComing soon...');
        onClose();
      },
    },
    {
      id: 'custom-reports',
      icon: <FileText className="w-8 h-8" />,
      title: 'Custom Reports',
      description: 'Generate detailed proposals, technical specs, and custom documentation',
      color: 'from-teal-500 to-cyan-500',
      action: () => {
        onClose();
        onOpenQuoteTemplates?.();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="min-h-screen text-white">
        
        {/* LANDING PAGE VIEW */}
        {viewMode === 'landing' && (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-md border-b border-white/10 shadow-xl">
              <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Advanced Quote Builder
                    </h1>
                    <p className="text-gray-300 mt-1">Professional-grade BESS configuration & electrical design</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 mb-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                      <Sparkles className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3">Complete Energy System Design Suite</h2>
                    <p className="text-gray-300 text-lg mb-4">
                      Design comprehensive battery energy storage systems with integrated renewables, 
                      detailed electrical specifications, and professional financial analysis.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-semibold">Electrical Design</p>
                          <p className="text-xs text-gray-400">Watts, Amps, Inverters</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <Sparkles className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-semibold">Hybrid Systems</p>
                          <p className="text-xs text-gray-400">Solar, Wind, Fuel Cells</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <Calculator className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-semibold">Financial Analysis</p>
                          <p className="text-xs text-gray-400">ROI, Payback, NPV</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tool Cards Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-left hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
                  >
                    {/* Gradient accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                    
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tool.color} mb-4`}>
                      {tool.icon}
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                    <p className="text-gray-300 text-sm">{tool.description}</p>
                    
                    {/* Arrow indicator */}
                    <div className="mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Launch →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CUSTOM CONFIGURATION VIEW */}
        {viewMode === 'custom-config' && (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
              <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setViewMode('landing')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold">Custom Configuration</h1>
                    <p className="text-gray-300 text-sm">Manually configure your BESS system</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="max-w-6xl mx-auto px-6 py-12">
              <div className="space-y-8">
                
                {/* Project Information Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-400" />
                    Project Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                        placeholder="e.g., Downtown Office Building BESS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Location
                      </label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                          placeholder="City, State/Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Configuration Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Battery className="w-6 h-6 text-purple-400" />
                    System Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Power Capacity */}
                    <div className="md:col-span-2">
                      <label className="block text-lg font-semibold mb-4">
                        Power Capacity (MW)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={storageSizeMW}
                          onChange={(e) => onStorageSizeChange(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <input
                          type="number"
                          value={storageSizeMW}
                          onChange={(e) => onStorageSizeChange(parseFloat(e.target.value) || 0.1)}
                          step="0.1"
                          min="0.1"
                          max="10"
                          className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-lg font-semibold"
                        />
                        <span className="text-gray-300 w-12 text-lg">MW</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Maximum discharge power output
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="md:col-span-2">
                      <label className="block text-lg font-semibold mb-4">
                        Duration (Hours)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0.5"
                          max="12"
                          step="0.5"
                          value={durationHours}
                          onChange={(e) => onDurationChange(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <input
                          type="number"
                          value={durationHours}
                          onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.5)}
                          step="0.5"
                          min="0.5"
                          max="12"
                          className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-center text-lg font-semibold"
                        />
                        <span className="text-gray-300 w-12 text-lg">hrs</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        How long the system can discharge at full power
                      </p>
                    </div>

                    {/* Battery Chemistry */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Battery Chemistry
                      </label>
                      <select
                        value={chemistry}
                        onChange={(e) => setChemistry(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <option value="lfp">LiFePO4 (LFP) - Long life, safe</option>
                        <option value="nmc">NMC - High energy density</option>
                        <option value="lto">LTO - Ultra-long life, fast charge</option>
                        <option value="sodium-ion">Sodium-Ion - Low cost</option>
                      </select>
                    </div>

                    {/* Installation Type */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Installation Type
                      </label>
                      <select
                        value={installationType}
                        onChange={(e) => setInstallationType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <option value="outdoor">Outdoor (Containerized)</option>
                        <option value="indoor">Indoor (Room/Vault)</option>
                        <option value="rooftop">Rooftop</option>
                      </select>
                    </div>

                    {/* Grid Connection */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Grid Connection
                      </label>
                      <select
                        value={gridConnection}
                        onChange={(e) => setGridConnection(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <option value="ac-coupled">AC-Coupled (Grid-tied)</option>
                        <option value="dc-coupled">DC-Coupled (with Solar)</option>
                        <option value="hybrid">Hybrid (AC+DC)</option>
                        <option value="off-grid">Off-Grid/Island Mode</option>
                      </select>
                    </div>

                    {/* Inverter Efficiency */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Inverter Efficiency (%)
                      </label>
                      <input
                        type="number"
                        value={inverterEfficiency}
                        onChange={(e) => setInverterEfficiency(parseFloat(e.target.value) || 90)}
                        min="85"
                        max="99"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Application & Use Case Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-green-400" />
                    Application & Use Case
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Application Type
                      </label>
                      <select
                        value={applicationType}
                        onChange={(e) => setApplicationType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial & Industrial</option>
                        <option value="utility">Utility Scale</option>
                        <option value="microgrid">Microgrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Primary Use Case
                      </label>
                      <select
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      >
                        <option value="peak-shaving">Peak Shaving / Demand Charge Reduction</option>
                        <option value="arbitrage">Energy Arbitrage / Time-of-Use</option>
                        <option value="backup">Backup Power / UPS</option>
                        <option value="solar-shifting">Solar + Storage / Self-Consumption</option>
                        <option value="frequency-regulation">Frequency Regulation</option>
                        <option value="renewable-smoothing">Renewable Smoothing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Expected Cycles per Year
                      </label>
                      <input
                        type="number"
                        value={cyclesPerYear}
                        onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        1 cycle = full charge + discharge
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Round-Trip Efficiency (%)
                      </label>
                      <input
                        type="number"
                        value={roundTripEfficiency}
                        onChange={(e) => setRoundTripEfficiency(parseFloat(e.target.value) || 85)}
                        min="75"
                        max="98"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Parameters Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-yellow-400" />
                    Financial Parameters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2">
                        Estimated System Cost (USD)
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-300 text-lg">$</span>
                        <input
                          type="number"
                          value={systemCost}
                          onChange={(e) => onSystemCostChange(parseFloat(e.target.value) || 0)}
                          step="10000"
                          min="0"
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-lg"
                          placeholder="Enter system cost"
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Total installed cost including equipment, installation, soft costs, and contingency
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Utility Rate ($/kWh)
                      </label>
                      <input
                        type="number"
                        value={utilityRate}
                        onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                        placeholder="e.g., 0.12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Demand Charge ($/kW/month)
                      </label>
                      <input
                        type="number"
                        value={demandCharge}
                        onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                        step="1"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                        placeholder="e.g., 15"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Warranty Period (Years)
                      </label>
                      <input
                        type="number"
                        value={warrantyYears}
                        onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 1)}
                        min="1"
                        max="25"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Electrical Specifications Section */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-purple-400" />
                    Electrical Specifications
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Power & Watts */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-300 mb-2 font-semibold">System Power</p>
                      <p className="text-3xl font-bold text-blue-400">{totalKW.toLocaleString()} kW</p>
                      <p className="text-sm text-gray-300 mt-1">{totalWatts.toLocaleString()} Watts</p>
                      <p className="text-xs text-gray-400 mt-2">{storageSizeMW.toFixed(2)} MW</p>
                    </div>

                    {/* AC Amps */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-300 mb-2 font-semibold">AC Current (3-Phase)</p>
                      <p className="text-3xl font-bold text-yellow-400">{maxAmpsAC.toLocaleString(undefined, {maximumFractionDigits: 0})} A</p>
                      <p className="text-sm text-gray-300 mt-1">@ {systemVoltage}V AC</p>
                      <p className="text-xs text-gray-400 mt-2">Per Phase</p>
                    </div>

                    {/* DC Amps */}
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-300 mb-2 font-semibold">DC Current</p>
                      <p className="text-3xl font-bold text-green-400">{maxAmpsDC.toLocaleString(undefined, {maximumFractionDigits: 0})} A</p>
                      <p className="text-sm text-gray-300 mt-1">@ {dcVoltage}V DC</p>
                      <p className="text-xs text-gray-400 mt-2">Battery Side</p>
                    </div>

                    {/* Inverters */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-300 mb-2 font-semibold">Inverter Count</p>
                      <p className="text-3xl font-bold text-purple-400">{numberOfInverters}</p>
                      <p className="text-sm text-gray-300 mt-1">{inverterRating} kW each</p>
                      <p className="text-xs text-gray-400 mt-2">{inverterType} type</p>
                    </div>
                  </div>

                  {/* Detailed Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Power Conversion
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Inverter Rating:</span>
                          <span className="text-white font-semibold">{inverterRating} kW each</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Inverters:</span>
                          <span className="text-white font-semibold">{numberOfInverters} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Inverter Type:</span>
                          <span className="text-white font-semibold capitalize">{inverterType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Efficiency:</span>
                          <span className="text-white font-semibold">{inverterEfficiency}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Electrical Distribution
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Switchgear Type:</span>
                          <span className="text-white font-semibold capitalize">{switchgearType.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Switchgear Rating:</span>
                          <span className="text-white font-semibold">{switchgearRating.toLocaleString()} A</span>
                        </div>
                        {transformerRequired && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Transformer:</span>
                              <span className="text-white font-semibold">{transformerRating.toLocaleString()} kVA</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Voltage Ratio:</span>
                              <span className="text-white font-semibold">{transformerVoltage}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-300 mb-3">Voltage Specifications</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">AC System Voltage:</span>
                          <span className="text-white font-semibold">{systemVoltage}V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">DC Battery Voltage:</span>
                          <span className="text-white font-semibold">{dcVoltage}V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Grid Connection:</span>
                          <span className="text-white font-semibold capitalize">{gridConnection.replace('-', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-300 mb-3">Battery Management</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">BMS Type:</span>
                          <span className="text-white font-semibold capitalize">{bmsType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Chemistry:</span>
                          <span className="text-white font-semibold">{chemistry.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Installation:</span>
                          <span className="text-white font-semibold capitalize">{installationType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-900/30 border border-purple-500/40 rounded-lg p-4">
                    <p className="text-xs text-purple-200">
                      ⚡ <strong>Electrical Note:</strong> All specifications are calculated based on {storageSizeMW} MW system rating. 
                      Actual equipment selection may vary based on site conditions, grid requirements, and local codes.
                    </p>
                  </div>
                </div>

                {/* Renewables & Alternative Power Section */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-green-400" />
                      Renewables & Alternative Power
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-semibold">Include Renewables</span>
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
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            ☀️ Solar PV System
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={solarPVIncluded}
                              onChange={(e) => setSolarPVIncluded(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-sm">Include Solar</span>
                          </label>
                        </div>

                        {solarPVIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Solar Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={solarCapacityKW}
                                onChange={(e) => setSolarCapacityKW(parseFloat(e.target.value) || 0)}
                                step="50"
                                min="0"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Panel Type
                              </label>
                              <select
                                value={solarPanelType}
                                onChange={(e) => setSolarPanelType(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              >
                                <option value="monocrystalline">Monocrystalline (20-22% eff.)</option>
                                <option value="polycrystalline">Polycrystalline (15-17% eff.)</option>
                                <option value="thin-film">Thin-Film (10-12% eff.)</option>
                                <option value="bifacial">Bifacial (22-24% eff.)</option>
                                <option value="perc">PERC (21-23% eff.)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Panel Efficiency (%)
                              </label>
                              <input
                                type="number"
                                value={solarPanelEfficiency}
                                onChange={(e) => setSolarPanelEfficiency(parseFloat(e.target.value) || 15)}
                                min="10"
                                max="25"
                                step="0.5"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Solar Inverter Type
                              </label>
                              <select
                                value={solarInverterType}
                                onChange={(e) => setSolarInverterType(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              >
                                <option value="string">String Inverter</option>
                                <option value="micro">Micro-Inverters</option>
                                <option value="power-optimizer">Power Optimizers</option>
                                <option value="central">Central Inverter</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 bg-yellow-900/20 rounded p-3">
                              <p className="text-sm text-yellow-200">
                                ☀️ Estimated Annual Production: <strong>{(solarCapacityKW * 1400).toLocaleString()} kWh/year</strong> (1,400 hrs/year avg)
                              </p>
                              <p className="text-xs text-yellow-300 mt-1">
                                Array Size: ~{(solarCapacityKW * 1000 * 6).toLocaleString()} sq ft (~{((solarCapacityKW * 1000 * 6) / 43560).toFixed(2)} acres) | ~{Math.ceil(solarCapacityKW / 0.4)} panels @ 400W
                              </p>
                              <p className="text-xs text-yellow-200 mt-1">
                                💡 Note: Assumes 6 sq ft per watt installed capacity (including spacing)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wind Turbine */}
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            💨 Wind Turbine System
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={windTurbineIncluded}
                              onChange={(e) => setWindTurbineIncluded(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm">Include Wind</span>
                          </label>
                        </div>

                        {windTurbineIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Wind Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={windCapacityKW}
                                onChange={(e) => setWindCapacityKW(parseFloat(e.target.value) || 0)}
                                step="50"
                                min="0"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Turbine Type
                              </label>
                              <select
                                value={windTurbineType}
                                onChange={(e) => setWindTurbineType(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              >
                                <option value="horizontal">Horizontal Axis (HAWT)</option>
                                <option value="vertical">Vertical Axis (VAWT)</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 bg-cyan-900/20 rounded p-3">
                              <p className="text-sm text-cyan-200">
                                💨 Estimated Annual Production: <strong>{(windCapacityKW * 2200).toLocaleString()} kWh/year</strong> (25% capacity factor)
                              </p>
                              <p className="text-xs text-cyan-300 mt-1">
                                Requires: Average wind speed of 5+ m/s | Tower height: 80-120m for utility scale
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fuel Cell */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            <Cpu className="w-5 h-5" />
                            Fuel Cell System
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fuelCellIncluded}
                              onChange={(e) => setFuelCellIncluded(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm">Include Fuel Cell</span>
                          </label>
                        </div>

                        {fuelCellIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Fuel Cell Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={fuelCellCapacityKW}
                                onChange={(e) => setFuelCellCapacityKW(parseFloat(e.target.value) || 0)}
                                step="25"
                                min="0"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Fuel Cell Type
                              </label>
                              <select
                                value={fuelCellType}
                                onChange={(e) => setFuelCellType(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              >
                                <option value="pem">PEM (Proton Exchange Membrane)</option>
                                <option value="sofc">SOFC (Solid Oxide)</option>
                                <option value="mcfc">MCFC (Molten Carbonate)</option>
                                <option value="pafc">PAFC (Phosphoric Acid)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2">
                                Fuel Type
                              </label>
                              <select
                                value={fuelType}
                                onChange={(e) => setFuelType(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
                              >
                                <option value="hydrogen">Hydrogen (H₂)</option>
                                <option value="natural-gas">Natural Gas</option>
                                <option value="biogas">Biogas</option>
                                <option value="methanol">Methanol</option>
                              </select>
                            </div>
                            <div className="bg-blue-900/20 rounded p-3">
                              <p className="text-sm text-blue-200">
                                ⚡ Efficiency: <strong>45-60%</strong>
                              </p>
                              <p className="text-xs text-blue-300 mt-1">
                                Clean, quiet, continuous power
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Backup Generators */}
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <GitBranch className="w-5 h-5" />
                          Backup Generators
                        </h4>

                        <div className="space-y-4">
                          {/* Diesel Generator */}
                          <div className="bg-orange-900/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold flex items-center gap-2">
                                🛢️ Diesel Generator
                              </h5>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={dieselGenIncluded}
                                  onChange={(e) => setDieselGenIncluded(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm">Include</span>
                              </label>
                            </div>
                            {dieselGenIncluded && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1">
                                    Capacity (kW)
                                  </label>
                                  <input
                                    type="number"
                                    value={dieselGenCapacityKW}
                                    onChange={(e) => setDieselGenCapacityKW(parseFloat(e.target.value) || 0)}
                                    step="50"
                                    min="0"
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <p className="text-xs text-orange-300">
                                    Fuel: ~0.3 gal/kWh<br/>Runtime: 8-24 hrs @ 50% load
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Natural Gas Generator */}
                          <div className="bg-orange-900/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold flex items-center gap-2">
                                🔥 Natural Gas Generator
                              </h5>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={naturalGasGenIncluded}
                                  onChange={(e) => setNaturalGasGenIncluded(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm">Include</span>
                              </label>
                            </div>
                            {naturalGasGenIncluded && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1">
                                    Capacity (kW)
                                  </label>
                                  <input
                                    type="number"
                                    value={naturalGasCapacityKW}
                                    onChange={(e) => setNaturalGasCapacityKW(parseFloat(e.target.value) || 0)}
                                    step="50"
                                    min="0"
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <p className="text-xs text-orange-300">
                                    Cleaner than diesel<br/>Continuous runtime w/ utility gas
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 bg-orange-900/30 rounded p-3">
                          <p className="text-xs text-orange-200">
                            💡 <strong>Note:</strong> Generators provide backup power but have emissions. Best used with BESS for short-duration peaks.
                          </p>
                        </div>
                      </div>

                      {/* Renewables Summary */}
                      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/40 rounded-xl p-6">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-green-400" />
                          Combined Renewables Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/10 rounded p-3">
                            <p className="text-xs text-gray-300 mb-1">Total Renewable</p>
                            <p className="text-2xl font-bold text-green-400">
                              {(
                                (solarPVIncluded ? solarCapacityKW : 0) +
                                (windTurbineIncluded ? windCapacityKW : 0) +
                                (fuelCellIncluded ? fuelCellCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-white/10 rounded p-3">
                            <p className="text-xs text-gray-300 mb-1">Backup Gen</p>
                            <p className="text-2xl font-bold text-orange-400">
                              {(
                                (dieselGenIncluded ? dieselGenCapacityKW : 0) +
                                (naturalGasGenIncluded ? naturalGasCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-white/10 rounded p-3">
                            <p className="text-xs text-gray-300 mb-1">BESS + Renewable</p>
                            <p className="text-2xl font-bold text-blue-400">
                              {(
                                totalKW +
                                (solarPVIncluded ? solarCapacityKW : 0) +
                                (windTurbineIncluded ? windCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-white/10 rounded p-3">
                            <p className="text-xs text-gray-300 mb-1">Total Capacity</p>
                            <p className="text-2xl font-bold text-purple-400">
                              {(
                                totalKW +
                                (solarPVIncluded ? solarCapacityKW : 0) +
                                (windTurbineIncluded ? windCapacityKW : 0) +
                                (fuelCellIncluded ? fuelCellCapacityKW : 0) +
                                (dieselGenIncluded ? dieselGenCapacityKW : 0) +
                                (naturalGasGenIncluded ? naturalGasCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {!includeRenewables && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-lg">Enable renewables to configure solar, wind, fuel cells, and backup generators</p>
                      <p className="text-sm mt-2">Hybrid systems can reduce costs and improve resiliency</p>
                    </div>
                  )}
                </div>

                {/* System Summary */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6">📊 System Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-sm text-gray-300 mb-1">System Rating</p>
                      <p className="text-3xl font-bold text-blue-400">
                        {storageSizeMW.toFixed(1)} MW
                      </p>
                      <p className="text-lg text-gray-300">
                        {storageSizeMWh.toFixed(1)} MWh
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-sm text-gray-300 mb-1">Total Cost</p>
                      <p className="text-3xl font-bold text-green-400">
                        ${(systemCost / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-sm text-gray-300">
                        ${(systemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-sm text-gray-300 mb-1">Application</p>
                      <p className="text-xl font-bold text-purple-400 capitalize">
                        {applicationType}
                      </p>
                      <p className="text-sm text-gray-300 capitalize">
                        {useCase.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setViewMode('landing')}
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
                        systemCost,
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
                      console.log('Advanced configuration:', configData);
                      onGenerateQuote?.();
                      onClose();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold transition-all hover:scale-105"
                  >
                    Generate Detailed Quote →
                  </button>
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  💡 Configuration Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <p className="font-semibold text-white mb-1">Power & Duration:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Peak shaving: 0.5-2 MW, 2-4 hrs</li>
                      <li>• Backup power: 0.5-5 MW, 4-8 hrs</li>
                      <li>• Utility scale: 10-100 MW, 2-4 hrs</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Battery Chemistry:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• LFP: Best for daily cycling, safest</li>
                      <li>• NMC: Higher energy density, premium cost</li>
                      <li>• LTO: 20,000+ cycles, fastest charge</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
