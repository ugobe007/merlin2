import React, { useState, useEffect } from 'react';
import { X, Wrench, Zap, Calculator, TrendingUp, Package, FileText, ArrowLeft, ArrowRight, Building2, MapPin, DollarSign, Battery, Calendar, Sparkles, Cpu, GitBranch, FileSpreadsheet, Eye, Sliders, Gauge, Wand2, PiggyBank, BarChart3, Box, ScrollText, Search } from 'lucide-react';
import InteractiveConfigDashboard from './wizard/InteractiveConfigDashboard';
import merlinImage from '../assets/images/new_Merlin.png';

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
  
  // Initial view mode
  initialView?: ViewMode;
}

type ViewMode = 'landing' | 'custom-config' | 'interactive-dashboard';

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
  initialView = 'landing',
}: AdvancedQuoteBuilderProps) {
  console.log('🏗️ AdvancedQuoteBuilder rendered with show:', show);
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'word' | 'excel'>('word');
  
  // NEW: State for Interactive Dashboard integration
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);
  
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
  const [inverterType, setInverterType] = useState('bidirectional'); // bidirectional or unidirectional
  const [inverterManufacturer, setInverterManufacturer] = useState('');
  const [inverterRating, setInverterRating] = useState(2500); // kW per inverter
  const [pcsQuoteSeparately, setPcsQuoteSeparately] = useState(false); // Quote PCS separately vs included
  const [numberOfInvertersInput, setNumberOfInvertersInput] = useState(1); // Manual override
  const [switchgearType, setSwitchgearType] = useState('medium-voltage');
  const [switchgearRating, setSwitchgearRating] = useState(5000); // Amps
  const [bmsType, setBmsType] = useState('distributed');
  const [bmsManufacturer, setBmsManufacturer] = useState('');
  const [transformerRequired, setTransformerRequired] = useState(true);
  const [transformerRating, setTransformerRating] = useState(3000); // kVA
  const [transformerVoltage, setTransformerVoltage] = useState('480V/12470V');
  
  // NEW: User-specified electrical inputs (optional overrides)
  const [systemWattsInput, setSystemWattsInput] = useState<number | ''>(''); // User input for watts
  const [systemAmpsACInput, setSystemAmpsACInput] = useState<number | ''>(''); // User input for AC amps
  const [systemAmpsDCInput, setSystemAmpsDCInput] = useState<number | ''>(''); // User input for DC amps
  
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

  // Calculated values (with user input overrides)
  const storageSizeMWh = storageSizeMW * durationHours;
  const calculatedWatts = storageSizeMW * 1000000; // Convert MW to W
  const totalWatts = systemWattsInput !== '' ? systemWattsInput : calculatedWatts;
  const totalKW = totalWatts / 1000; // Convert W to kW
  const calculatedAmpsAC = (totalWatts / systemVoltage) / Math.sqrt(3); // 3-phase AC
  const maxAmpsAC = systemAmpsACInput !== '' ? systemAmpsACInput : calculatedAmpsAC;
  const calculatedAmpsDC = (totalWatts / dcVoltage);
  const maxAmpsDC = systemAmpsDCInput !== '' ? systemAmpsDCInput : calculatedAmpsDC;
  const numberOfInverters = numberOfInvertersInput || Math.ceil(totalKW / inverterRating);
  const requiredTransformerKVA = totalKW * 1.25; // 25% safety factor
  
  // Calculate system cost based on storage size and pricing tiers
  useEffect(() => {
    const effectiveBatteryKwh = storageSizeMWh * 1000;
    
    // BESS pricing per kWh based on system size (matching BessQuoteBuilder logic)
    let pricePerKwh = 168; // Default: Small systems (<1 MWh)
    if (effectiveBatteryKwh >= 10000) {
      pricePerKwh = 118; // Utility scale (>10 MWh): $118/kWh
    } else if (effectiveBatteryKwh >= 1000) {
      pricePerKwh = 138; // Medium systems (1-10 MWh): $138/kWh
    }
    
    // Calculate base BESS cost
    const bessCapEx = effectiveBatteryKwh * pricePerKwh;
    
    // Add BOS and EPC costs (using typical values)
    const bosMultiplier = 1.15; // 15% BOS costs
    const epcMultiplier = 1.10; // 10% EPC costs
    
    // Add renewable costs if included
    const solarCost = solarPVIncluded ? solarCapacityKW * 1000 : 0; // ~$1000/kWp
    const windCost = windTurbineIncluded ? windCapacityKW * 1500 : 0; // ~$1500/kW
    const fuelCellCost = fuelCellIncluded ? fuelCellCapacityKW * 2000 : 0; // ~$2000/kW
    const dieselCost = dieselGenIncluded ? dieselGenCapacityKW * 800 : 0; // ~$800/kW
    const natGasCost = naturalGasGenIncluded ? naturalGasCapacityKW * 1000 : 0; // ~$1000/kW
    
    const calculatedSystemCost = (bessCapEx * bosMultiplier * epcMultiplier) + 
      solarCost + windCost + fuelCellCost + dieselCost + natGasCost;
    
    onSystemCostChange(calculatedSystemCost);
  }, [storageSizeMW, durationHours, storageSizeMWh, solarPVIncluded, solarCapacityKW, 
      windTurbineIncluded, windCapacityKW, fuelCellIncluded, fuelCellCapacityKW,
      dieselGenIncluded, dieselGenCapacityKW, naturalGasGenIncluded, naturalGasCapacityKW, onSystemCostChange]);
  
  useEffect(() => {
    if (show) {
      setViewMode('landing');
      window.scrollTo(0, 0);
    }
  }, [show]);

  // Sync Interactive Dashboard renewable values to Custom Configuration form
  useEffect(() => {
    if (viewMode === 'custom-config') {
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

  // Reset to initialView when modal opens
  useEffect(() => {
    if (show) {
      console.log('🎭 Modal opened, setting viewMode to:', initialView);
      setViewMode(initialView);
    }
  }, [show, initialView]);

  if (!show) return null;

  // Tool cards configuration
  const tools = [
    {
      id: 'custom-config',
      icon: (
        <div className="w-40 h-40 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-2 shadow-2xl">
          <img src={merlinImage} alt="Merlin" className="w-full h-full object-contain" />
        </div>
      ),
      title: 'Start Here',
      description: 'Complete BESS design with electrical specs, renewables, and detailed system parameters',
      color: 'from-amber-500 to-orange-500',
      action: () => setViewMode('custom-config'),
      largeFont: true, // Make this button's font larger
    },
    {
      id: 'interactive-dashboard',
      icon: <Gauge className="w-8 h-8" />,
      title: 'Interactive Dashboard',
      description: 'Fine-tune your configuration with real-time sliders, see instant cost and ROI updates',
      color: 'from-cyan-400 via-blue-500 to-indigo-600',
      action: () => setViewMode('interactive-dashboard'),
    },
    {
      id: 'ai-optimization',
      icon: <Wand2 className="w-8 h-8" />,
      title: 'Smart Wizard',
      description: 'Let our AI suggest the optimal system configuration for your use case',
      color: 'from-purple-400 via-pink-500 to-rose-600',
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
      icon: <PiggyBank className="w-8 h-8" />,
      title: 'Financial Calculator',
      description: 'Calculate ROI, payback period, and financing options',
      color: 'from-emerald-400 via-green-500 to-teal-600',
      action: () => {
        onClose();
        onOpenFinancing?.();
      },
    },
    {
      id: 'market-analytics',
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Market Analytics',
      description: 'View market trends, pricing intelligence, and competitive analysis',
      color: 'from-orange-400 via-red-500 to-pink-600',
      action: () => {
        onClose();
        onOpenMarketIntel?.();
      },
    },
    {
      id: 'component-library',
      icon: <Box className="w-8 h-8" />,
      title: 'Vendor Library',
      description: 'Browse available batteries, inverters, and balance of system equipment',
      color: 'from-indigo-400 via-purple-500 to-violet-600',
      action: () => {
        alert('🔧 Component Library\n\nBrowse batteries, solar panels, inverters, and BOS equipment.\n\nComing soon...');
        onClose();
      },
    },
    {
      id: 'custom-reports',
      icon: <ScrollText className="w-8 h-8" />,
      title: 'Custom Reports',
      description: 'Generate detailed proposals, technical specs, and custom documentation',
      color: 'from-teal-400 via-cyan-500 to-sky-600',
      action: () => {
        onClose();
        onOpenQuoteTemplates?.();
      },
    },
    {
      id: 'quote-preview',
      icon: <Search className="w-8 h-8" />,
      title: 'Quote Preview',
      description: 'See what your professional quote looks like in Word and Excel formats',
      color: 'from-blue-400 via-indigo-500 to-purple-600',
      action: () => setShowQuotePreview(true),
    },
  ];

  console.log('🎭 Current viewMode:', viewMode);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-600">
      <div className="min-h-screen text-gray-100">
        
        {/* LANDING PAGE VIEW */}
        {viewMode === 'landing' && (
          <>
            {/* Premium header with purple-blue gradient and quick access buttons */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 border-b-4 border-purple-400 shadow-2xl backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl shadow-2xl ring-2 ring-purple-300/30">
                      <Wrench className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl">
                        Advanced Quote Builder
                      </h1>
                      <p className="text-purple-200 text-xs drop-shadow-lg font-medium">Professional-grade BESS configuration</p>
                    </div>
                  </div>
                  
                  {/* Quick Access Buttons */}
                  <div className="hidden lg:flex items-center gap-3">
                    <button
                      onClick={() => {
                        setViewMode('custom-config');
                        setTimeout(() => {
                          const electricalSection = document.querySelector('[data-section="electrical"]');
                          if (electricalSection) {
                            electricalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 bg-blue-600/30 hover:bg-blue-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/40 hover:border-blue-300/60 transition-all duration-300 hover:scale-105"
                    >
                      <Zap className="w-4 h-4 text-blue-200" />
                      <span className="text-xs font-semibold text-white">Electrical</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setViewMode('custom-config');
                        setTimeout(() => {
                          const renewablesSection = document.querySelector('[data-section="renewables"]');
                          if (renewablesSection) {
                            renewablesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 bg-green-600/30 hover:bg-green-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-400/40 hover:border-green-300/60 transition-all duration-300 hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 text-green-200" />
                      <span className="text-xs font-semibold text-white">Renewables</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setViewMode('custom-config');
                        setTimeout(() => {
                          const financialSection = document.querySelector('[data-section="financial"]');
                          if (financialSection) {
                            financialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className="group flex items-center gap-2 bg-purple-600/30 hover:bg-purple-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-400/40 hover:border-purple-300/60 transition-all duration-300 hover:scale-105"
                    >
                      <Calculator className="w-4 h-4 text-purple-200" />
                      <span className="text-xs font-semibold text-white">Financial</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all text-white hover:shadow-xl hover:scale-110 ring-2 ring-white/20 hover:ring-white/40"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* BESS Market Pricing Intelligence - NEW */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
              <div className="bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-cyan-600/20 backdrop-blur-xl border-2 border-emerald-400/30 rounded-2xl p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">BESS Market Pricing Intelligence</h3>
                      <p className="text-sm text-emerald-200">Real-time installed costs (Q4 2025)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-200">Last Updated</p>
                    <p className="text-sm font-bold text-white">Nov 2025</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Small Systems */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/40 rounded-xl p-4 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-blue-200 font-semibold mb-1">Small Systems</p>
                        <p className="text-2xl font-bold text-white">${'168'}<span className="text-lg text-blue-200">/kWh</span></p>
                      </div>
                      <div className="bg-blue-500/30 rounded-lg px-2 py-1">
                        <Battery className="w-5 h-5 text-blue-200" />
                      </div>
                    </div>
                    <p className="text-xs text-blue-100 mb-2">≤ 2 MWh capacity</p>
                    <div className="pt-2 border-t border-blue-400/30">
                      <p className="text-xs text-blue-200">Includes all BOS + installation</p>
                    </div>
                  </div>

                  {/* Medium Systems */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/40 rounded-xl p-4 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-purple-200 font-semibold mb-1">Medium Systems</p>
                        <p className="text-2xl font-bold text-white">${'138'}<span className="text-lg text-purple-200">/kWh</span></p>
                      </div>
                      <div className="bg-purple-500/30 rounded-lg px-2 py-1">
                        <Battery className="w-5 h-5 text-purple-200" />
                      </div>
                    </div>
                    <p className="text-xs text-purple-100 mb-2">2-15 MWh capacity</p>
                    <div className="pt-2 border-t border-purple-400/30">
                      <p className="text-xs text-purple-200">Commercial & C&I scale</p>
                    </div>
                  </div>

                  {/* Large/Utility Systems */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/40 rounded-xl p-4 hover:scale-105 transition-transform duration-300 ring-2 ring-green-400/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-green-200 font-semibold mb-1 flex items-center gap-1">
                          Utility Scale
                          <Sparkles className="w-3 h-3 text-green-300" />
                        </p>
                        <p className="text-2xl font-bold text-white">${'118'}<span className="text-lg text-green-200">/kWh</span></p>
                      </div>
                      <div className="bg-green-500/30 rounded-lg px-2 py-1">
                        <Battery className="w-5 h-5 text-green-200" />
                      </div>
                    </div>
                    <p className="text-xs text-green-100 mb-2">15+ MWh capacity</p>
                    <div className="pt-2 border-t border-green-400/30">
                      <p className="text-xs text-green-200">Utility-scale installed cost</p>
                    </div>
                  </div>
                </div>

                {/* Volume Discount Info */}
                <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-emerald-200 mb-2 font-semibold">💰 Volume Discounts Available:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="text-emerald-100">10+ MWh: <span className="text-white font-bold">2% off</span></div>
                    <div className="text-emerald-100">25+ MWh: <span className="text-white font-bold">5% off</span></div>
                    <div className="text-emerald-100">50+ MWh: <span className="text-white font-bold">8% off</span></div>
                    <div className="text-emerald-100">100+ MWh: <span className="text-white font-bold">12% off</span></div>
                    <div className="text-emerald-100">250+ MWh: <span className="text-white font-bold">15% off</span></div>
                    <div className="text-emerald-100">500+ MWh: <span className="text-white font-bold">18% off</span></div>
                    <div className="text-emerald-100">1+ GWh: <span className="text-white font-bold">22% off</span></div>
                    <div className="text-emerald-200 italic">Max discount</div>
                  </div>
                </div>

                {/* Technology Note */}
                <div className="mt-3 flex items-start gap-2 text-xs text-emerald-100">
                  <Sparkles className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-semibold">Market Intelligence:</span> Pricing reflects Q4 2025 realistic installed costs including all balance of system components, installation labor, and profit margins. Based on LFP chemistry improvements and actual utility RFP pricing.
                  </p>
                </div>
              </div>
            </div>

            {/* Premium tool cards grid with 3D light gradient styling */}
            <div className="max-w-7xl mx-auto px-6 py-12">
              <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
                ✨ Professional Tools & Wizards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tools.map((tool, index) => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className={`group relative bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl text-left transition-all duration-500 will-change-transform hover:scale-105 hover:-translate-y-3 animate-fadeIn overflow-visible shadow-[0_10px_40px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] border-t-2 border-white/50 ${tool.id === 'custom-config' ? 'md:col-span-2 lg:col-span-3 p-8 md:p-12 min-h-[200px]' : 'p-8 min-h-[320px]'}`}
                  >
                    {/* Magical glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-20 rounded-3xl transition-all duration-500 blur-xl`} />
                    
                    {/* Sparkle effect */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className={`${tool.id === 'custom-config' ? 'w-7 h-7' : 'w-5 h-5'} text-yellow-300 animate-pulse`} />
                    </div>
                    
                    {/* Special horizontal layout for Start Here card with Merlin on left */}
                    {tool.id === 'custom-config' ? (
                      <div className="flex items-center gap-8">
                        {/* Merlin on the left */}
                        <div className="flex-shrink-0">
                          {tool.icon}
                        </div>
                        
                        {/* Content on the right */}
                        <div className="flex-1">
                          <h3 className="relative text-4xl md:text-5xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-pink-200 group-hover:to-cyan-200 group-hover:bg-clip-text transition-all duration-300 drop-shadow-lg">
                            {tool.title}
                          </h3>
                          <p className="relative text-white/90 text-lg md:text-xl leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-md">
                            {tool.description}
                          </p>
                          
                          {/* Animated arrow indicator */}
                          <div className="relative mt-6 flex items-center text-white/80 group-hover:text-yellow-200 transition-all duration-300">
                            <span className="text-sm font-bold tracking-wide drop-shadow-md">Launch Tool</span>
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                            <div className="absolute -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Large colorful icon with glow effect - no box */}
                        <div className="relative mb-6 inline-flex h-24 w-24 items-center justify-center">
                          <div className={`bg-gradient-to-br ${tool.color} p-6 rounded-full shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                            <div className="text-white [&>svg]:w-12 [&>svg]:h-12">
                              {tool.icon}
                            </div>
                          </div>
                          {/* Animated glow ring on hover */}
                          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500`} />
                        </div>
                        
                        {/* Content with white text for gradient background */}
                        <h3 className="relative text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-pink-200 group-hover:to-cyan-200 group-hover:bg-clip-text transition-all duration-300 drop-shadow-lg">
                          {tool.title}
                        </h3>
                        <p className="relative text-white/90 text-sm leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-md">
                          {tool.description}
                        </p>
                        
                        {/* Animated arrow indicator */}
                        <div className="relative mt-6 flex items-center text-white/80 group-hover:text-yellow-200 transition-all duration-300">
                          <span className="text-sm font-bold tracking-wide drop-shadow-md">Launch Tool</span>
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                          <div className="absolute -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Bottom accent line with 3D effect */}
                    <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${tool.color} opacity-70 group-hover:opacity-100 transition-all duration-500 rounded-b-3xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]`} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CUSTOM CONFIGURATION VIEW */}
        {viewMode === 'custom-config' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Enhanced header for config view */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 border-b-2 border-blue-700 shadow-2xl">
              <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setViewMode('landing')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all text-white hover:shadow-lg"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Custom Configuration</h1>
                    <p className="text-blue-100 text-sm">Manually configure your BESS system</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
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
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Downtown Office Building BESS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Location
                      </label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="City, State/Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced System Configuration Section */}
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Battery className="w-7 h-7 text-purple-600" />
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">System Configuration</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Power Capacity */}
                    <div className="md:col-span-2">
                      <label className="block text-lg font-bold mb-4 text-slate-900">
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
                          className="flex-1 h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <input
                          type="number"
                          value={storageSizeMW}
                          onChange={(e) => onStorageSizeChange(parseFloat(e.target.value) || 0.1)}
                          step="0.1"
                          min="0.1"
                          max="10"
                          className="w-32 px-3 py-2 bg-white border-2 border-purple-300 text-slate-900 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        <span className="text-slate-900 w-12 text-lg font-bold">MW</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-2 font-medium">
                        Maximum discharge power output
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="md:col-span-2">
                      <label className="block text-lg font-bold mb-4 text-slate-900">
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
                          className="flex-1 h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <input
                          type="number"
                          value={durationHours}
                          onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.5)}
                          step="0.5"
                          min="0.5"
                          max="12"
                          className="w-32 px-3 py-2 bg-white border-2 border-purple-300 text-slate-900 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        <span className="text-slate-900 w-12 text-lg font-bold">hrs</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-2 font-medium">
                        How long the system can discharge at full power
                      </p>
                    </div>

                    {/* Battery Chemistry */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Battery Chemistry
                      </label>
                      <select
                        value={chemistry}
                        onChange={(e) => setChemistry(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
                        <option value="lfp">LiFePO4 (LFP) - Long life, safe</option>
                        <option value="nmc">NMC - High energy density</option>
                        <option value="lto">LTO - Ultra-long life, fast charge</option>
                        <option value="sodium-ion">Sodium-Ion - Low cost</option>
                      </select>
                    </div>

                    {/* Installation Type */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Installation Type
                      </label>
                      <select
                        value={installationType}
                        onChange={(e) => setInstallationType(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
                        <option value="outdoor">Outdoor (Containerized)</option>
                        <option value="indoor">Indoor (Room/Vault)</option>
                        <option value="rooftop">Rooftop</option>
                      </select>
                    </div>

                    {/* Grid Connection */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Grid Connection
                      </label>
                      <select
                        value={gridConnection}
                        onChange={(e) => setGridConnection(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
                        <option value="ac-coupled">AC-Coupled (Grid-tied)</option>
                        <option value="dc-coupled">DC-Coupled (with Solar)</option>
                        <option value="hybrid">Hybrid (AC+DC)</option>
                        <option value="off-grid">Off-Grid/Island Mode</option>
                      </select>
                    </div>

                    {/* Inverter Efficiency */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Inverter Efficiency (%)
                      </label>
                      <input
                        type="number"
                        value={inverterEfficiency}
                        onChange={(e) => setInverterEfficiency(parseFloat(e.target.value) || 90)}
                        min="85"
                        max="99"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Application & Use Case Section */}
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Building2 className="w-7 h-7 text-purple-600" />
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Application & Use Case</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Application Type
                      </label>
                      <select
                        value={applicationType}
                        onChange={(e) => setApplicationType(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial & Industrial</option>
                        <option value="utility">Utility Scale</option>
                        <option value="microgrid">Microgrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Primary Use Case
                      </label>
                      <select
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
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
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Expected Cycles per Year
                      </label>
                      <input
                        type="number"
                        value={cyclesPerYear}
                        onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                      />
                      <p className="text-xs text-slate-700 mt-1 font-medium">
                        1 cycle = full charge + discharge
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Round-Trip Efficiency (%)
                      </label>
                      <input
                        type="number"
                        value={roundTripEfficiency}
                        onChange={(e) => setRoundTripEfficiency(parseFloat(e.target.value) || 85)}
                        min="75"
                        max="98"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Financial Parameters Section */}
                <div data-section="financial" className="bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 border-2 border-blue-300 rounded-2xl p-8 shadow-xl scroll-mt-24">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <DollarSign className="w-7 h-7 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Financial Parameters</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Estimated System Cost (USD)
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-900 text-lg font-bold">$</span>
                        <input
                          type="number"
                          value={systemCost}
                          onChange={(e) => onSystemCostChange(parseFloat(e.target.value) || 0)}
                          step="10000"
                          min="0"
                          className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter system cost"
                        />
                      </div>
                      <p className="text-sm text-slate-700 mt-2 font-medium">
                        Total installed cost including equipment, installation, soft costs, and contingency
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Utility Rate ($/kWh)
                      </label>
                      <input
                        type="number"
                        value={utilityRate}
                        onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 0.12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900">
                        Demand Charge ($/kW/month)
                      </label>
                      <input
                        type="number"
                        value={demandCharge}
                        onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                        step="1"
                        min="0"
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., 15"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-slate-900">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Warranty Period (Years)
                      </label>
                      <input
                        type="number"
                        value={warrantyYears}
                        onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 1)}
                        min="1"
                        max="25"
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 text-slate-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Electrical Specifications Section - INTERACTIVE WITH INPUTS */}
                <div data-section="electrical" className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 border-2 border-purple-800 rounded-2xl p-8 shadow-2xl scroll-mt-24">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Zap className="w-7 h-7 text-yellow-300" />
                    <span className="bg-gradient-to-r from-yellow-200 via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">Electrical Specifications & PCS Configuration</span>
                  </h3>
                  
                  {/* Power Conversion System (PCS) Configuration */}
                  <div className="bg-white border-2 border-purple-300 rounded-xl p-6 mb-6 shadow-lg">
                    <h4 className="text-lg font-bold mb-4 text-slate-900">Power Conversion System (PCS)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* PCS Quoting Option */}
                      <div className="col-span-full">
                        <label className="block text-sm font-semibold mb-3 text-slate-900">
                          PCS Quoting Method
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 text-slate-900 rounded-lg px-4 py-3 hover:bg-gray-100 transition-all flex-1">
                            <input
                              type="radio"
                              checked={!pcsQuoteSeparately}
                              onChange={() => setPcsQuoteSeparately(false)}
                              className="w-4 h-4 text-purple-500"
                            />
                            <span className="text-sm font-medium">Included with BESS System</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 text-slate-900 rounded-lg px-4 py-3 hover:bg-gray-100 transition-all flex-1">
                            <input
                              type="radio"
                              checked={pcsQuoteSeparately}
                              onChange={() => setPcsQuoteSeparately(true)}
                              className="w-4 h-4 text-purple-500"
                            />
                            <span className="text-sm font-medium">Quote PCS Separately</span>
                          </label>
                        </div>
                        {pcsQuoteSeparately && (
                          <p className="text-xs text-yellow-800 mt-2 bg-yellow-100 border border-yellow-400 rounded-lg p-2">
                            💡 PCS will be itemized separately in the quote with detailed specifications
                          </p>
                        )}
                      </div>

                      {/* Inverter Type */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900">
                          Inverter Type
                        </label>
                        <select
                          value={inverterType}
                          onChange={(e) => setInverterType(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg font-medium shadow-inner hover:bg-gray-100 transition-colors"
                        >
                          <option value="bidirectional">Bidirectional Inverter</option>
                          <option value="unidirectional">Unidirectional (Charge Only)</option>
                        </select>
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          {inverterType === 'bidirectional' ? '⚡ Supports charge & discharge' : '⚡ Charge only (typical for solar)'}
                        </p>
                      </div>

                      {/* Number of Inverters */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900">
                          Number of Inverters
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={numberOfInvertersInput}
                            onChange={(e) => setNumberOfInvertersInput(parseInt(e.target.value) || 1)}
                            min="1"
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg font-medium shadow-inner"
                            placeholder="Auto-calculated"
                          />
                          <button
                            onClick={() => setNumberOfInvertersInput(Math.ceil(totalKW / inverterRating))}
                            className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 rounded-lg text-sm font-semibold transition-all"
                            title="Auto-calculate based on system size"
                          >
                            Auto
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          Suggested: {Math.ceil(totalKW / inverterRating)} units @ {inverterRating} kW each
                        </p>
                      </div>

                      {/* Inverter Rating */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900">
                          Inverter Rating (kW per unit)
                        </label>
                        <input
                          type="number"
                          value={inverterRating}
                          onChange={(e) => setInverterRating(parseFloat(e.target.value) || 2500)}
                          step="100"
                          min="100"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg font-medium shadow-inner"
                        />
                      </div>

                      {/* Manufacturer */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900">
                          Inverter Manufacturer (Optional)
                        </label>
                        <input
                          type="text"
                          value={inverterManufacturer}
                          onChange={(e) => setInverterManufacturer(e.target.value)}
                          placeholder="e.g., SMA, Sungrow, Power Electronics"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg placeholder-gray-400 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Electrical Parameters - INPUT FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* System Watts */}
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
                      <label className="block text-xs text-slate-900 mb-2 font-semibold">System Power (Watts)</label>
                      <input
                        type="number"
                        value={systemWattsInput}
                        onChange={(e) => setSystemWattsInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder={calculatedWatts.toLocaleString()}
                        className="w-full px-3 py-2 bg-white border-2 border-blue-300 rounded-lg text-slate-900 font-medium text-sm shadow-inner"
                      />
                      <p className="text-xs text-blue-900 mt-2 font-bold">
                        {totalKW.toLocaleString()} kW / {(totalKW/1000).toFixed(2)} MW
                      </p>
                      <p className="text-xs text-slate-700 mt-1 font-medium">Calculated: {calculatedWatts.toLocaleString()} W</p>
                    </div>

                    {/* AC Amps */}
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 shadow-lg">
                      <label className="block text-xs text-slate-900 mb-2 font-semibold">AC Current (3-Phase)</label>
                      <input
                        type="number"
                        value={systemAmpsACInput}
                        onChange={(e) => setSystemAmpsACInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder={calculatedAmpsAC.toFixed(0)}
                        className="w-full px-3 py-2 bg-white border-2 border-yellow-300 rounded-lg text-slate-900 font-medium text-sm shadow-inner"
                      />
                      <p className="text-xs text-yellow-900 mt-2 font-bold">
                        @ {systemVoltage}V AC Per Phase
                      </p>
                      <p className="text-xs text-slate-700 mt-1 font-medium">Calculated: {calculatedAmpsAC.toFixed(0)} A</p>
                    </div>

                    {/* DC Amps */}
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 shadow-lg">
                      <label className="block text-xs text-slate-900 mb-2 font-semibold">DC Current (Battery Side)</label>
                      <input
                        type="number"
                        value={systemAmpsDCInput}
                        onChange={(e) => setSystemAmpsDCInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder={calculatedAmpsDC.toFixed(0)}
                        className="w-full px-3 py-2 bg-white border-2 border-green-300 rounded-lg text-slate-900 font-medium text-sm shadow-inner"
                      />
                      <p className="text-xs text-green-900 mt-2 font-bold">
                        @ {dcVoltage}V DC
                      </p>
                      <p className="text-xs text-slate-700 mt-1 font-medium">Calculated: {calculatedAmpsDC.toFixed(0)} A</p>
                    </div>
                  </div>

                  {/* Voltage Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                      <label className="block text-sm font-semibold mb-2 text-slate-900">
                        AC System Voltage (V)
                      </label>
                      <select
                        value={systemVoltage}
                        onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg font-medium shadow-inner"
                      >
                        <option value={208}>208V (Small Commercial)</option>
                        <option value={480}>480V (Standard Industrial)</option>
                        <option value={600}>600V (Large Industrial)</option>
                        <option value={4160}>4.16 kV (Medium Voltage)</option>
                        <option value={13800}>13.8 kV (Utility Scale)</option>
                      </select>
                    </div>

                    <div className="bg-white border-2 border-purple-300 rounded-lg p-4 shadow-md">
                      <label className="block text-sm font-semibold mb-2 text-slate-900">
                        DC Battery Voltage (V)
                      </label>
                      <input
                        type="number"
                        value={dcVoltage}
                        onChange={(e) => setDcVoltage(parseInt(e.target.value) || 1000)}
                        step="100"
                        min="100"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg font-medium shadow-inner"
                      />
                      <p className="text-xs text-slate-700 mt-1 font-medium">Typical: 800V - 1500V DC</p>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white border-2 border-purple-300 rounded-xl p-6 shadow-xl">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-purple-600" />
                      System Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-700 mb-1 font-medium">Total Power:</p>
                        <p className="text-xl font-bold text-slate-900">{(totalKW/1000).toFixed(2)} MW</p>
                      </div>
                      <div>
                        <p className="text-slate-700 mb-1 font-medium">Inverters:</p>
                        <p className="text-xl font-bold text-slate-900">{numberOfInverters} units</p>
                      </div>
                      <div>
                        <p className="text-slate-700 mb-1 font-medium">AC Current:</p>
                        <p className="text-xl font-bold text-yellow-700">{maxAmpsAC.toLocaleString(undefined, {maximumFractionDigits: 0})} A</p>
                      </div>
                      <div>
                        <p className="text-slate-700 mb-1 font-medium">DC Current:</p>
                        <p className="text-xl font-bold text-green-700">{maxAmpsDC.toLocaleString(undefined, {maximumFractionDigits: 0})} A</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-purple-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-medium">PCS Configuration:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {inverterType === 'bidirectional' ? '⚡ Bidirectional' : '→ Unidirectional'} | 
                          {pcsQuoteSeparately ? ' Quoted Separately' : ' Included in System'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
                    <p className="text-xs text-slate-900 font-medium">
                      ⚡ <strong>Note:</strong> Input custom values to override calculated specifications. 
                      Leave blank to use auto-calculated values based on {storageSizeMW} MW system rating.
                      {pcsQuoteSeparately && ' PCS will be itemized with detailed manufacturer specifications.'}
                    </p>
                  </div>
                </div>

                {/* Renewables & Alternative Power Section */}
                <div data-section="renewables" className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 scroll-mt-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-green-600" />
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Renewables & Alternative Power</span>
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-semibold text-slate-900">Include Renewables</span>
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
                      <div className="bg-yellow-100 border border-yellow-400 rounded-xl p-6">
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
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Solar Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={solarCapacityKW}
                                onChange={(e) => setSolarCapacityKW(parseFloat(e.target.value) || 0)}
                                step="50"
                                min="0"
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Panel Type
                              </label>
                              <select
                                value={solarPanelType}
                                onChange={(e) => setSolarPanelType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              >
                                <option value="monocrystalline">Monocrystalline (20-22% eff.)</option>
                                <option value="polycrystalline">Polycrystalline (15-17% eff.)</option>
                                <option value="thin-film">Thin-Film (10-12% eff.)</option>
                                <option value="bifacial">Bifacial (22-24% eff.)</option>
                                <option value="perc">PERC (21-23% eff.)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Panel Efficiency (%)
                              </label>
                              <input
                                type="number"
                                value={solarPanelEfficiency}
                                onChange={(e) => setSolarPanelEfficiency(parseFloat(e.target.value) || 15)}
                                min="10"
                                max="25"
                                step="0.5"
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Solar Inverter Type
                              </label>
                              <select
                                value={solarInverterType}
                                onChange={(e) => setSolarInverterType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              >
                                <option value="string">String Inverter</option>
                                <option value="micro">Micro-Inverters</option>
                                <option value="power-optimizer">Power Optimizers</option>
                                <option value="central">Central Inverter</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 bg-yellow-200 border-2 border-yellow-400 rounded p-3">
                              <p className="text-sm text-slate-900 font-bold">
                                ☀️ Estimated Annual Production: <strong>{(solarCapacityKW * 1400).toLocaleString()} kWh/year</strong> (1,400 hrs/year avg)
                              </p>
                              <p className="text-xs text-slate-900 mt-1 font-medium">
                                Array Size: ~{(solarCapacityKW * 1000 * 6).toLocaleString()} sq ft (~{((solarCapacityKW * 1000 * 6) / 43560).toFixed(2)} acres) | ~{Math.ceil(solarCapacityKW / 0.4)} panels @ 400W
                              </p>
                              <p className="text-xs text-slate-900 mt-1 font-medium">
                                💡 Note: Assumes 6 sq ft per watt installed capacity (including spacing)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wind Turbine */}
                      <div className="bg-cyan-50 border-2 border-cyan-300 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                            💨 Wind Turbine System
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={windTurbineIncluded}
                              onChange={(e) => setWindTurbineIncluded(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-900 font-semibold">Include Wind</span>
                          </label>
                        </div>

                        {windTurbineIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Wind Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={windCapacityKW}
                                onChange={(e) => setWindCapacityKW(parseFloat(e.target.value) || 0)}
                                step="50"
                                min="0"
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Turbine Type
                              </label>
                              <select
                                value={windTurbineType}
                                onChange={(e) => setWindTurbineType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              >
                                <option value="horizontal">Horizontal Axis (HAWT)</option>
                                <option value="vertical">Vertical Axis (VAWT)</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 bg-cyan-200 border-2 border-cyan-400 rounded p-3">
                              <p className="text-sm text-slate-900 font-bold">
                                💨 Estimated Annual Production: <strong>{(windCapacityKW * 2200).toLocaleString()} kWh/year</strong> (25% capacity factor)
                              </p>
                              <p className="text-xs text-slate-900 mt-1 font-medium">
                                Requires: Average wind speed of 5+ m/s | Tower height: 80-120m for utility scale
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fuel Cell */}
                      <div className="bg-blue-100 border border-blue-400 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                            <Cpu className="w-5 h-5 text-blue-600" />
                            Fuel Cell System
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fuelCellIncluded}
                              onChange={(e) => setFuelCellIncluded(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-900 font-semibold">Include Fuel Cell</span>
                          </label>
                        </div>

                        {fuelCellIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Fuel Cell Capacity (kW)
                              </label>
                              <input
                                type="number"
                                value={fuelCellCapacityKW}
                                onChange={(e) => setFuelCellCapacityKW(parseFloat(e.target.value) || 0)}
                                step="25"
                                min="0"
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Fuel Cell Type
                              </label>
                              <select
                                value={fuelCellType}
                                onChange={(e) => setFuelCellType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              >
                                <option value="pem">PEM (Proton Exchange Membrane)</option>
                                <option value="sofc">SOFC (Solid Oxide)</option>
                                <option value="mcfc">MCFC (Molten Carbonate)</option>
                                <option value="pafc">PAFC (Phosphoric Acid)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2 text-slate-900">
                                Fuel Type
                              </label>
                              <select
                                value={fuelType}
                                onChange={(e) => setFuelType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 text-slate-900 rounded-lg font-medium"
                              >
                                <option value="hydrogen">Hydrogen (H₂)</option>
                                <option value="natural-gas">Natural Gas</option>
                                <option value="biogas">Biogas</option>
                                <option value="methanol">Methanol</option>
                              </select>
                            </div>
                            <div className="bg-blue-200 border border-blue-400 rounded p-3">
                              <p className="text-sm text-slate-900 font-bold">
                                ⚡ Efficiency: <strong>45-60%</strong>
                              </p>
                              <p className="text-xs text-slate-700 mt-1 font-medium">
                                Clean, quiet, continuous power
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Backup Generators */}
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
                        <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <GitBranch className="w-5 h-5 text-orange-600" />
                          Backup Generators
                        </h4>

                        <div className="space-y-4">
                          {/* Diesel Generator */}
                          <div className="bg-orange-100 rounded-lg p-4 border border-orange-300">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold flex items-center gap-2 text-slate-900">
                                🛢️ Diesel Generator
                              </h5>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={dieselGenIncluded}
                                  onChange={(e) => setDieselGenIncluded(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-900 font-semibold">Include</span>
                              </label>
                            </div>
                            {dieselGenIncluded && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1 text-slate-900">
                                    Capacity (kW)
                                  </label>
                                  <input
                                    type="number"
                                    value={dieselGenCapacityKW}
                                    onChange={(e) => setDieselGenCapacityKW(parseFloat(e.target.value) || 0)}
                                    step="50"
                                    min="0"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <p className="text-xs text-slate-700 font-medium">
                                    Fuel: ~0.3 gal/kWh<br/>Runtime: 8-24 hrs @ 50% load
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Natural Gas Generator */}
                          <div className="bg-orange-100 rounded-lg p-4 border border-orange-300">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold flex items-center gap-2 text-slate-900">
                                🔥 Natural Gas Generator
                              </h5>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={naturalGasGenIncluded}
                                  onChange={(e) => setNaturalGasGenIncluded(e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-900 font-semibold">Include</span>
                              </label>
                            </div>
                            {naturalGasGenIncluded && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1 text-slate-900">
                                    Capacity (kW)
                                  </label>
                                  <input
                                    type="number"
                                    value={naturalGasCapacityKW}
                                    onChange={(e) => setNaturalGasCapacityKW(parseFloat(e.target.value) || 0)}
                                    step="50"
                                    min="0"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 text-slate-900 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <p className="text-xs text-slate-700 font-medium">
                                    Cleaner than diesel<br/>Continuous runtime w/ utility gas
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 bg-orange-200 border border-orange-400 rounded p-3">
                          <p className="text-xs text-slate-900 font-medium">
                            💡 <strong>Note:</strong> Generators provide backup power but have emissions. Best used with BESS for short-duration peaks.
                          </p>
                        </div>
                      </div>

                      {/* Renewables Summary */}
                      <div className="bg-white border-2 border-green-300 rounded-xl p-6">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          Combined Renewables Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-green-50 border-2 border-green-300 rounded p-3">
                            <p className="text-xs text-slate-700 mb-1 font-medium">Total Renewable</p>
                            <p className="text-2xl font-bold text-green-700">
                              {(
                                (solarPVIncluded ? solarCapacityKW : 0) +
                                (windTurbineIncluded ? windCapacityKW : 0) +
                                (fuelCellIncluded ? fuelCellCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-orange-50 border-2 border-orange-300 rounded p-3">
                            <p className="text-xs text-slate-700 mb-1 font-medium">Backup Gen</p>
                            <p className="text-2xl font-bold text-orange-700">
                              {(
                                (dieselGenIncluded ? dieselGenCapacityKW : 0) +
                                (naturalGasGenIncluded ? naturalGasCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-blue-50 border-2 border-blue-300 rounded p-3">
                            <p className="text-xs text-slate-700 mb-1 font-medium">BESS + Renewable</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {(
                                totalKW +
                                (solarPVIncluded ? solarCapacityKW : 0) +
                                (windTurbineIncluded ? windCapacityKW : 0)
                              ).toFixed(0)} kW
                            </p>
                          </div>
                          <div className="bg-purple-50 border-2 border-purple-300 rounded p-3">
                            <p className="text-xs text-slate-700 mb-1 font-medium">Total Capacity</p>
                            <p className="text-2xl font-bold text-purple-700">
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
                    <div className="text-center py-8">
                      <p className="text-lg text-slate-900 font-bold">Enable renewables to configure solar, wind, fuel cells, and backup generators</p>
                      <p className="text-sm mt-2 text-slate-700 font-medium">Hybrid systems can reduce costs and improve resiliency</p>
                    </div>
                  )}
                </div>

                {/* System Summary */}
                <div className="bg-white border-2 border-blue-300 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                    📊 System Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                      <p className="text-sm text-slate-700 mb-1 font-medium">System Rating</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {storageSizeMW.toFixed(1)} MW
                      </p>
                      <p className="text-lg text-slate-700 font-bold">
                        {storageSizeMWh.toFixed(1)} MWh
                      </p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                      <p className="text-sm text-slate-700 mb-1 font-medium">Total Cost</p>
                      <p className="text-3xl font-bold text-green-700">
                        ${(systemCost / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-sm text-slate-700 font-bold">
                        ${(systemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                      </p>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
                      <p className="text-sm text-slate-700 mb-1 font-medium">Application</p>
                      <p className="text-xl font-bold text-purple-700 capitalize">
                        {applicationType}
                      </p>
                      <p className="text-sm text-slate-700 font-bold capitalize">
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
              <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  💡 Configuration Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-900">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Power & Duration:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Peak shaving: 0.5-2 MW, 2-4 hrs</li>
                      <li>• Backup power: 0.5-5 MW, 4-8 hrs</li>
                      <li>• Utility scale: 10-100 MW, 2-4 hrs</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Battery Chemistry:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• LFP: Best for daily cycling, safest</li>
                      <li>• NMC: Higher energy density, premium cost</li>
                      <li>• LTO: 20,000+ cycles, fastest charge</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Quote Preview Modal */}
      {showQuotePreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <Eye className="w-8 h-8" />
                  Quote Format Preview
                </h2>
                <p className="text-blue-100 mt-1">See how your professional quote will look</p>
              </div>
              <button
                onClick={() => setShowQuotePreview(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Format Tabs */}
              <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
                <button 
                  onClick={() => setPreviewFormat('word')}
                  className={`px-6 py-3 font-semibold transition-colors ${
                    previewFormat === 'word' 
                      ? 'text-blue-600 border-b-4 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📄 Word Document
                </button>
                <button 
                  onClick={() => setPreviewFormat('excel')}
                  className={`px-6 py-3 font-semibold transition-colors ${
                    previewFormat === 'excel' 
                      ? 'text-green-600 border-b-4 border-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Excel Spreadsheet
                </button>
              </div>

              {/* Word Document Preview */}
              {previewFormat === 'word' && (
              <div className="bg-gray-50 rounded-xl p-8 shadow-inner border-2 border-gray-200">
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-4xl mx-auto" style={{ fontFamily: 'Calibri, sans-serif' }}>
                  {/* Document Header */}
                  <div className="border-b-4 border-blue-600 pb-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">⚡ MERLIN Energy</h1>
                        <p className="text-lg text-gray-600">Battery Energy Storage System Quote</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p className="font-semibold">Quote #MER-{Math.floor(Math.random() * 10000)}</p>
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
                        <p className="text-gray-900">{projectName || 'Sample BESS Project'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Location:</p>
                        <p className="text-gray-900">{location || 'California, USA'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Application Type:</p>
                        <p className="text-gray-900 capitalize">{applicationType}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Use Case:</p>
                        <p className="text-gray-900 capitalize">{useCase.replace('-', ' ')}</p>
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
                          <td className="py-2 text-gray-900 text-right">{storageSizeMW.toFixed(1)} MW</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Energy Capacity:</td>
                          <td className="py-2 text-gray-900 text-right">{storageSizeMWh.toFixed(1)} MWh</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Duration:</td>
                          <td className="py-2 text-gray-900 text-right">{durationHours.toFixed(1)} hours</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Battery Chemistry:</td>
                          <td className="py-2 text-gray-900 text-right uppercase">{chemistry}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Round-Trip Efficiency:</td>
                          <td className="py-2 text-gray-900 text-right">{roundTripEfficiency}%</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Installation Type:</td>
                          <td className="py-2 text-gray-900 text-right capitalize">{installationType}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Grid Connection:</td>
                          <td className="py-2 text-gray-900 text-right uppercase">{gridConnection}</td>
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
                          <td className="py-2 font-semibold text-gray-700">System Voltage (AC):</td>
                          <td className="py-2 text-gray-900 text-right">{systemVoltage}V</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">DC Voltage:</td>
                          <td className="py-2 text-gray-900 text-right">{dcVoltage}V</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Inverter Type:</td>
                          <td className="py-2 text-gray-900 text-right capitalize">{inverterType}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Number of Inverters:</td>
                          <td className="py-2 text-gray-900 text-right">{numberOfInverters} units</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Inverter Rating (each):</td>
                          <td className="py-2 text-gray-900 text-right">{inverterRating} kW</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Total Inverter Capacity:</td>
                          <td className="py-2 text-gray-900 text-right">{(numberOfInverters * inverterRating)} kW</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Inverter Efficiency:</td>
                          <td className="py-2 text-gray-900 text-right">{inverterEfficiency}%</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Switchgear Type:</td>
                          <td className="py-2 text-gray-900 text-right capitalize">{switchgearType.replace('-', ' ')}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Switchgear Rating:</td>
                          <td className="py-2 text-gray-900 text-right">{switchgearRating} A</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">BMS Type:</td>
                          <td className="py-2 text-gray-900 text-right capitalize">{bmsType}</td>
                        </tr>
                        {transformerRequired && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Transformer Rating:</td>
                              <td className="py-2 text-gray-900 text-right">{transformerRating} kVA</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700">Transformer Voltage:</td>
                              <td className="py-2 text-gray-900 text-right">{transformerVoltage}</td>
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
                          <td className="py-2 font-semibold text-gray-700">Expected Cycles per Year:</td>
                          <td className="py-2 text-gray-900 text-right">{cyclesPerYear} cycles</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Warranty Period:</td>
                          <td className="py-2 text-gray-900 text-right">{warrantyYears} years</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Reference Utility Rate:</td>
                          <td className="py-2 text-gray-900 text-right">${utilityRate.toFixed(3)}/kWh</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-semibold text-gray-700">Reference Demand Charge:</td>
                          <td className="py-2 text-gray-900 text-right">${demandCharge}/kW</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Renewable Integration (if applicable) */}
                  {(solarPVIncluded || windTurbineIncluded || fuelCellIncluded || dieselGenIncluded || naturalGasGenIncluded) && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                        Renewable & Backup Integration
                      </h2>
                      <table className="w-full text-sm">
                        <tbody>
                          {solarPVIncluded && (
                            <>
                              <tr className="border-b border-gray-200 bg-yellow-50">
                                <td className="py-2 font-semibold text-gray-700">☀️ Solar PV Capacity:</td>
                                <td className="py-2 text-gray-900 text-right">{solarCapacityKW} kW</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold text-gray-700 pl-6">Panel Type:</td>
                                <td className="py-2 text-gray-900 text-right capitalize">{solarPanelType}</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold text-gray-700 pl-6">Panel Efficiency:</td>
                                <td className="py-2 text-gray-900 text-right">{solarPanelEfficiency}%</td>
                              </tr>
                            </>
                          )}
                          {windTurbineIncluded && (
                            <>
                              <tr className="border-b border-gray-200 bg-blue-50">
                                <td className="py-2 font-semibold text-gray-700">💨 Wind Turbine Capacity:</td>
                                <td className="py-2 text-gray-900 text-right">{windCapacityKW} kW</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold text-gray-700 pl-6">Turbine Type:</td>
                                <td className="py-2 text-gray-900 text-right capitalize">{windTurbineType}</td>
                              </tr>
                            </>
                          )}
                          {fuelCellIncluded && (
                            <>
                              <tr className="border-b border-gray-200 bg-green-50">
                                <td className="py-2 font-semibold text-gray-700">⚗️ Fuel Cell Capacity:</td>
                                <td className="py-2 text-gray-900 text-right">{fuelCellCapacityKW} kW</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold text-gray-700 pl-6">Fuel Cell Type:</td>
                                <td className="py-2 text-gray-900 text-right uppercase">{fuelCellType}</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 font-semibold text-gray-700 pl-6">Fuel Type:</td>
                                <td className="py-2 text-gray-900 text-right capitalize">{fuelType}</td>
                              </tr>
                            </>
                          )}
                          {dieselGenIncluded && (
                            <tr className="border-b border-gray-200 bg-orange-50">
                              <td className="py-2 font-semibold text-gray-700">🔧 Diesel Generator Capacity:</td>
                              <td className="py-2 text-gray-900 text-right">{dieselGenCapacityKW} kW</td>
                            </tr>
                          )}
                          {naturalGasGenIncluded && (
                            <tr className="border-b border-gray-200 bg-purple-50">
                              <td className="py-2 font-semibold text-gray-700">🔥 Natural Gas Generator:</td>
                              <td className="py-2 text-gray-900 text-right">{naturalGasCapacityKW} kW</td>
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
                          ${(systemCost / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Cost per kW:</span>
                        <span className="font-semibold">${(systemCost / (storageSizeMW * 1000)).toFixed(0)}/kW</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Cost per kWh:</span>
                        <span className="font-semibold">${(systemCost / (storageSizeMWh * 1000)).toFixed(0)}/kWh</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-300 text-xs text-gray-600">
                    <p className="mb-2">This quote is valid for 30 days from the date of issue.</p>
                    <p className="mb-2">Terms: 50% deposit upon contract signing, 50% upon commissioning.</p>
                    <p>Warranty: {warrantyYears} year comprehensive warranty included.</p>
                  </div>
                </div>
              </div>
              )}

              {/* Excel Spreadsheet Preview */}
              {previewFormat === 'excel' && (
              <div className="bg-gray-50 rounded-xl p-8 shadow-inner border-2 border-gray-200">
                <div className="bg-white rounded-lg p-4 shadow-lg max-w-5xl mx-auto overflow-x-auto">
                  {/* Excel-style spreadsheet */}
                  <div className="text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
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
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Quote #</div>
                      <div className="col-span-3 p-2 border-r border-gray-400">MER-{Math.floor(Math.random() * 10000)}</div>
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Date</div>
                      <div className="col-span-3 p-2">{new Date().toLocaleDateString()}</div>
                    </div>

                    {/* Empty Row */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 p-2">&nbsp;</div>
                    </div>

                    {/* Project Information Header */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 bg-blue-100 font-bold p-2">PROJECT INFORMATION</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Project Name</div>
                      <div className="col-span-9 p-2">{projectName || 'Sample BESS Project'}</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Location</div>
                      <div className="col-span-9 p-2">{location || 'California, USA'}</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Application</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 capitalize">{applicationType}</div>
                      <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">Use Case</div>
                      <div className="col-span-3 p-2 capitalize">{useCase.replace('-', ' ')}</div>
                    </div>

                    {/* Empty Row */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 p-2">&nbsp;</div>
                    </div>

                    {/* System Specifications */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 bg-blue-100 font-bold p-2">SYSTEM SPECIFICATIONS</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-gray-50">
                      <div className="col-span-6 font-semibold p-2 border-r border-gray-400">Parameter</div>
                      <div className="col-span-3 font-semibold p-2 border-r border-gray-400 text-center">Value</div>
                      <div className="col-span-3 font-semibold p-2 text-center">Unit</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Power Rating</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{storageSizeMW.toFixed(1)}</div>
                      <div className="col-span-3 p-2 text-center">MW</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Energy Capacity</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{storageSizeMWh.toFixed(1)}</div>
                      <div className="col-span-3 p-2 text-center">MWh</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Duration</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{durationHours.toFixed(1)}</div>
                      <div className="col-span-3 p-2 text-center">hours</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Battery Chemistry</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">{chemistry}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Round-Trip Efficiency</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{roundTripEfficiency}</div>
                      <div className="col-span-3 p-2 text-center">%</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Cycles per Year</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{cyclesPerYear}</div>
                      <div className="col-span-3 p-2 text-center">cycles/yr</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Installation Type</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">{installationType}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Grid Connection</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">{gridConnection}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>

                    {/* Empty Row */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 p-2">&nbsp;</div>
                    </div>

                    {/* Electrical Specifications */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 bg-blue-100 font-bold p-2">ELECTRICAL SPECIFICATIONS</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">System Voltage (AC)</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{systemVoltage}</div>
                      <div className="col-span-3 p-2 text-center">V</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">DC Voltage</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{dcVoltage}</div>
                      <div className="col-span-3 p-2 text-center">V</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Number of Inverters</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{numberOfInverters}</div>
                      <div className="col-span-3 p-2 text-center">units</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Inverter Rating (each)</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{inverterRating}</div>
                      <div className="col-span-3 p-2 text-center">kW</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Inverter Efficiency</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{inverterEfficiency}</div>
                      <div className="col-span-3 p-2 text-center">%</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Inverter Type</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">{inverterType}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Switchgear Type</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">{switchgearType.replace('-', ' ')}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Switchgear Rating</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{switchgearRating}</div>
                      <div className="col-span-3 p-2 text-center">A</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">BMS Type</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">{bmsType}</div>
                      <div className="col-span-3 p-2 text-center">-</div>
                    </div>
                    {transformerRequired && (
                      <>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">Transformer Rating</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">{transformerRating}</div>
                          <div className="col-span-3 p-2 text-center">kVA</div>
                        </div>
                        <div className="grid grid-cols-12 border-x border-b border-gray-400">
                          <div className="col-span-6 p-2 border-r border-gray-400">Transformer Voltage</div>
                          <div className="col-span-3 p-2 border-r border-gray-400 text-right">{transformerVoltage}</div>
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
                      <div className="col-span-12 bg-green-100 font-bold p-2">FINANCIAL SUMMARY</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-yellow-50">
                      <div className="col-span-6 font-bold p-2 border-r border-gray-400">Total System Cost</div>
                      <div className="col-span-3 font-bold p-2 border-r border-gray-400 text-right text-green-700">${(systemCost / 1000000).toFixed(2)}M</div>
                      <div className="col-span-3 p-2 text-center">USD</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Cost per kW</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">${(systemCost / (storageSizeMW * 1000)).toFixed(0)}</div>
                      <div className="col-span-3 p-2 text-center">$/kW</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Cost per kWh</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">${(systemCost / (storageSizeMWh * 1000)).toFixed(0)}</div>
                      <div className="col-span-3 p-2 text-center">$/kWh</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Warranty Period</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">{warrantyYears}</div>
                      <div className="col-span-3 p-2 text-center">years</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Utility Rate (Reference)</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">${utilityRate.toFixed(3)}</div>
                      <div className="col-span-3 p-2 text-center">$/kWh</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-6 p-2 border-r border-gray-400">Demand Charge (Reference)</div>
                      <div className="col-span-3 p-2 border-r border-gray-400 text-right">${demandCharge}</div>
                      <div className="col-span-3 p-2 text-center">$/kW</div>
                    </div>

                    {/* Footer */}
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 p-2">&nbsp;</div>
                    </div>
                    <div className="grid grid-cols-12 border-x border-b border-gray-400">
                      <div className="col-span-12 bg-gray-100 text-xs p-3">
                        <p className="mb-1"><strong>Quote Valid:</strong> 30 days from issue date</p>
                        <p className="mb-1"><strong>Payment Terms:</strong> 50% deposit upon contract signing, 50% upon commissioning</p>
                        <p><strong>Includes:</strong> {warrantyYears}-year comprehensive warranty, installation, commissioning, and training</p>
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
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    alert('📥 Export functionality coming soon!\n\nYou will be able to download this quote as:\n• Microsoft Word (.docx)\n• Excel Spreadsheet (.xlsx)\n• PDF Document (.pdf)');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  📥 Download Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Dashboard View */}
      {viewMode === 'interactive-dashboard' && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50">
          <InteractiveConfigDashboard
            initialStorageSizeMW={storageSizeMW}
            initialDurationHours={durationHours}
            initialSolarMW={solarMW}
            initialWindMW={windMW}
            initialGeneratorMW={generatorMW}
            solarSpaceConfig={{ spaceType: 'rooftop', useAI: false }}
            evChargerConfig={{ 
              level2_11kw: 0, 
              level2_19kw: 0, 
              dcfast_50kw: 0, 
              dcfast_150kw: 0, 
              dcfast_350kw: 0 
            }}
            windConfig={{ turbineSize: '2.5', numberOfTurbines: 0, useAI: false }}
            generatorConfig={{ generatorType: 'diesel', numberOfUnits: 0, sizePerUnit: 0, useAI: false }}
            industryTemplate=""
            location={location || 'California'}
            electricityRate={utilityRate}
            useCaseData={{}}
            onConfigurationChange={(config) => {
              onStorageSizeChange(config.storageSizeMW);
              onDurationChange(config.durationHours);
              setSolarMW(config.solarMW || 0);
              setWindMW(config.windMW || 0);
              setGeneratorMW(config.generatorMW || 0);
            }}
            onContinue={() => {
              // Capture final configuration and move to Custom Configuration
              setViewMode('custom-config');
            }}
            continueButtonText="Continue to Configuration"
          />
          
          {/* Close button overlay */}
          <button
            onClick={() => setViewMode('landing')}
            className="fixed top-6 right-6 z-[60] bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-2xl font-bold transition-all"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
