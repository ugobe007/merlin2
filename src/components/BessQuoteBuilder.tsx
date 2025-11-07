import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, HeadingLevel, PageBreak } from "docx";
import { saveAs } from 'file-saver';
import { UTILITY_RATES } from '../utils/energyCalculations';
import { generateCalculationBreakdown, exportCalculationsToText } from '../utils/calculationFormulas';
import { italicParagraph, boldParagraph, createHeaderRow, createDataRow, createCalculationTables } from '../utils/wordHelpers';
import { authService } from '../services/authService';
import { calculateBESSPricing, PRICING_SOURCES, formatPricingForDisplay, calculateRealWorldPrice } from '../utils/bessPricing';
import EditableUserProfile from './EditableUserProfile';
import Portfolio from './Portfolio';
import PublicProfileViewer from './PublicProfileViewer';
import AuthModal from './AuthModal';
import JoinMerlinModal from './modals/JoinMerlinModal';
import LayoutPreferenceModal from './modals/LayoutPreferenceModal';
import CalculationModal from './modals/CalculationModal';
import VendorManager from './VendorManager';
import PricingPlans from './PricingPlans';
import WelcomeModal from './modals/WelcomeModal';
import AccountSetup from './modals/AccountSetup';
import EnhancedProfile from './EnhancedProfile';
import AdvancedAnalytics from './AdvancedAnalytics';
import FinancingCalculator from './FinancingCalculator';
import UseCaseTemplates from './UseCaseTemplates';
import PricingDataCapture from './PricingDataCapture';
import MarketIntelligenceDashboard from './MarketIntelligenceDashboard';
import VendorSponsorship from './VendorSponsorship';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import SecurityPrivacySettings from './SecurityPrivacySettings';
import SystemHealth from './SystemHealth';
import StatusPage from './StatusPage';
import UtilityRatesManager from './UtilityRatesManager';
import QuoteTemplates from './QuoteTemplates';
import PricingPresets from './PricingPresets';
import QuoteReviewWorkflow from './QuoteReviewWorkflow';
import UseCaseROI from './UseCaseROI';
import type { UseCaseData } from './UseCaseROI';
import type { ProfileData } from './modals/AccountSetup';
import type { UseCaseTemplate } from './UseCaseTemplates';
import merlinImage from "../assets/images/new_Merlin.png";
import merlinDancingVideo from "../assets/images/Merlin_video.mp4";
import SmartWizard from './wizard/SmartWizardV2';
import magicPoofSound from "../assets/sounds/Magic_Poof.mp3";
import SaveProjectModal from './modals/SaveProjectModal';
import LoadProjectModal from './modals/LoadProjectModal';
import QuotePreviewModal from './modals/QuotePreviewModal';
import AboutMerlin from './AboutMerlin';
import VendorPortal from './VendorPortal';
import EnergyNewsTicker from './EnergyNewsTicker';


export default function BessQuoteBuilder() {
  console.log('🏗️ BessQuoteBuilder component rendering');
  
  // Check for public profile route
  const [viewMode, setViewMode] = useState<'app' | 'public-profile'>('app');
  const [publicProfileSlug, setPublicProfileSlug] = useState<string | null>(null);
  
  // Advanced layout preferences - declare early to avoid block-scoped issues
  const [showAdvancedQuoteBuilder, setShowAdvancedQuoteBuilder] = useState(false);
  const [userLayoutPreference, setUserLayoutPreference] = useState<'beginner' | 'advanced'>('beginner');
  const [showLayoutPreferenceModal, setShowLayoutPreferenceModal] = useState(false);
  
  // Advanced form state
  const [energyCapacity, setEnergyCapacity] = useState(100);
  const [powerRating, setPowerRating] = useState(50);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // ALL OTHER STATE - moved to beginning to avoid hooks rule violations
  const [quoteName, setQuoteName] = useState('My BESS Project');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [showVendorManager, setShowVendorManager] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingPlans, setShowPricingPlans] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showEnhancedProfile, setShowEnhancedProfile] = useState(false);
  const [isFirstTimeProfile, setIsFirstTimeProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showVendorPortal, setShowVendorPortal] = useState(false);

  // System Configuration State - ALL MOVED TO BEGINNING
  const [powerMW, setPowerMW] = useState(1);
  const [standbyHours, setStandbyHours] = useState(2);
  const [gridMode, setGridMode] = useState('On-grid');
  const [useCase, setUseCase] = useState('EV Charging Stations');
  const [generatorMW, setGeneratorMW] = useState(0);
  const [solarMWp, setSolarMWp] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [valueKwh, setValueKwh] = useState(0.25);
  const [utilization, setUtilization] = useState(0.3);
  const [warranty, setWarranty] = useState('10 years');
  const [location, setLocation] = useState('UK (6%)');
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [currency, setCurrency] = useState('USD');
  
  // New flexible sizing state
  const [energyUnit, setEnergyUnit] = useState('kWh');
  const [powerUnit, setPowerUnit] = useState('kW');
  const [applicationType, setApplicationType] = useState<'residential' | 'commercial' | 'utility'>('residential');
  
  // Assumptions State (default values) - VALIDATED AGAINST NREL ATB 2024
  // Source: https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage
  // Uses NREL Moderate Scenario pricing for commercial/small utility scale
  const [batteryKwh, setBatteryKwh] = useState(140); // Small scale, between NREL Moderate (155) and Advanced (135)
  const [pcsKw, setPcsKw] = useState(150); // Industry standard PCS pricing
  const [bosPercent, setBosPercent] = useState(0.12); // NREL recommended BOS percentage
  const [epcPercent, setEpcPercent] = useState(0.15); // Industry standard EPC (NREL includes in total cost)
  const [offGridPcsFactor, setOffGridPcsFactor] = useState(1.25);
  const [onGridPcsFactor, setOnGridPcsFactor] = useState(1);
  const [genKw, setGenKw] = useState(300);
  const [solarKwp, setSolarKwp] = useState(0);
  const [windKw, setWindKw] = useState(1200);
  const [tariffPercent, setTariffPercent] = useState(0.10);

  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showSaveProjectModal, setShowSaveProjectModal] = useState(false);
  const [showLoadProjectModal, setShowLoadProjectModal] = useState(false);
  const [showPricingDataCapture, setShowPricingDataCapture] = useState(false);
  const [showMarketIntelligence, setShowMarketIntelligence] = useState(false);
  const [showVendorSponsorship, setShowVendorSponsorship] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Benefit explanation modals - ALL MOVED TO BEGINNING
  const [showCostSavingsModal, setShowCostSavingsModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showSustainabilityModal, setShowSustainabilityModal] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [showUtilityRates, setShowUtilityRates] = useState(false);
  const [showQuoteTemplates, setShowQuoteTemplates] = useState(false);
  const [showPricingPresets, setShowPricingPresets] = useState(false);
  const [showReviewWorkflow, setShowReviewWorkflow] = useState(false);
  const [currentQuoteStatus, setCurrentQuoteStatus] = useState<'draft' | 'in-review' | 'approved' | 'rejected' | 'shared'>('draft');
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [showQuotePreview, setShowQuotePreview] = useState(false);

  // If viewing a public profile, show that instead - check early but after all hooks
  if (viewMode === 'public-profile' && publicProfileSlug) {
    const handleNavigateToApp = () => {
      window.history.pushState({}, '', '/');
      setViewMode('app');
      setShowAuthModal(true);
    };
    return <PublicProfileViewer profileSlug={publicProfileSlug} onSignUp={handleNavigateToApp} />;
  }

  console.log('🔍 Current state - showAdvancedQuoteBuilder:', showAdvancedQuoteBuilder);

  useEffect(() => {
    // Simple routing check - look for /profile/ in URL
    const path = window.location.pathname;
    if (path.startsWith('/profile/')) {
      const slug = path.split('/profile/')[1];
      setPublicProfileSlug(slug);
      setViewMode('public-profile');
    }
  }, []);

  const handleNavigateToApp = () => {
    window.history.pushState({}, '', '/');
    setViewMode('app');
    setShowAuthModal(true);
  };

  // Render main quote form for advanced interface
  const renderMainQuoteForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Configuration Panel */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {/* Header with Workflow Guide */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Advanced System Configuration</h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🚀 Quick Start Workflow:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li><strong>1.</strong> Enter your project's power requirements (any size welcome)</li>
                <li><strong>2.</strong> Choose your application type and use case</li>
                <li><strong>3.</strong> Configure advanced settings as needed</li>
                <li><strong>4.</strong> Review AI recommendations and generate quote</li>
              </ol>
            </div>
          </div>
          
          {/* Project Sizing - Flexible Input */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">📐 Project Sizing</h4>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Enter your specific power requirements.</strong> Our system supports projects from residential installations (10kWh) 
                to utility-scale deployments (100+ MWh). No arbitrary size limits!
              </p>
              
              {/* Power Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Energy Storage Capacity
                    <span className="text-xs text-gray-500 ml-1">(Total energy stored)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={energyCapacity}
                      onChange={(e) => setEnergyCapacity(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity (e.g., 100, 1000, 50000)"
                      min="1"
                    />
                    <select 
                      value={energyUnit}
                      onChange={(e) => setEnergyUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kWh">kWh</option>
                      <option value="MWh">MWh</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Examples: 50kWh (home), 1MWh (commercial), 100MWh (utility)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Power Output Rating
                    <span className="text-xs text-gray-500 ml-1">(Maximum discharge rate)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={powerRating}
                      onChange={(e) => setPowerRating(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter power rating (e.g., 25, 500, 10000)"
                      min="1"
                    />
                    <select 
                      value={powerUnit}
                      onChange={(e) => setPowerUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kW">kW</option>
                      <option value="MW">MW</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Examples: 25kW (home), 1MW (commercial), 50MW (utility)</p>
                </div>
              </div>
              
              {/* Duration Calculator */}
              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Discharge Duration:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {powerRating > 0 ? (energyCapacity / powerRating).toFixed(1) : 0} hours
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How long the system can provide power at maximum output
                </p>
              </div>
            </div>
          </div>

          {/* Application Type Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">🏢 Application Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => setApplicationType('residential')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'residential' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className={`font-semibold ${applicationType === 'residential' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Residential
                </div>
                <div className={`text-xs ${applicationType === 'residential' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Home energy storage
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('commercial')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'commercial' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className={`font-semibold ${applicationType === 'commercial' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Commercial
                </div>
                <div className={`text-xs ${applicationType === 'commercial' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Business & industrial
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('utility')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'utility' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className={`font-semibold ${applicationType === 'utility' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Utility Scale
                </div>
                <div className={`text-xs ${applicationType === 'utility' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Grid-scale projects
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('ups')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'ups' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🔋</div>
                <div className={`font-semibold ${applicationType === 'ups' ? 'text-blue-700' : 'text-gray-700'}`}>
                  UPS/Backup
                </div>
                <div className={`text-xs ${applicationType === 'ups' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Critical power backup
                </div>
              </button>
            </div>
          </div>

          {/* Progress Indicator & Next Steps */}
          {applicationType && (
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Great! You selected {applicationType} application</h4>
                  <p className="text-sm text-green-700">Now let's configure your specific requirements</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">👉</span>
                  Your Next Steps:
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-gray-700">Set your power requirements above ⬆️</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-gray-700">Use Quick Actions below to generate analysis ⬇️</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-gray-700">Explore Advanced Options for detailed configuration</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Quick Start:</span> 
                    {applicationType === 'residential' && " Try 10-20 kWh for most homes, or use our ROI calculator below."}
                    {applicationType === 'commercial' && " Start with 50-500 kWh depending on your facility size."}
                    {applicationType === 'utility' && " Consider 1-100 MWh based on grid requirements."}
                    {applicationType === 'ups' && " UPS systems typically need 0.5-2 hours duration with power matching critical loads."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings Guide - Moved here for better visibility */}
          <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📚</span>
              Advanced Settings Guide
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <div className="font-semibold text-amber-800">Configure System Size</div>
                  <div className="text-amber-700">Enter your exact power requirements - no limits! Use kW/kWh for smaller projects, MW/MWh for large ones.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <div className="font-semibold text-amber-800">Select Application Type</div>
                  <div className="text-amber-700">Choose residential, commercial, or utility-scale for optimized recommendations.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <div className="font-semibold text-amber-800">Review AI Suggestions</div>
                  <div className="text-amber-700">Our AI analyzes your configuration and provides real-time optimization tips.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <div className="font-semibold text-amber-800">Generate Analysis</div>
                  <div className="text-amber-700">Use Quick Actions to run detailed analytics, create quotes, or export your configuration.</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-amber-300">
              <div className="text-xs text-amber-700">
                <strong>💡 Pro Tip:</strong> Start with your actual power needs, then let our AI guide optimizations. 
                Don't worry about predefined categories - every project is unique!
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t pt-4">
            <button 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">⚙️</span>
                <div className="text-left">
                  <div className="font-medium text-gray-700">Advanced Configuration</div>
                  <div className="text-xs text-gray-500">Fine-tune technical specifications</div>
                </div>
              </div>
              <span className={`transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''} text-gray-400`}>
                ▼
              </span>
            </button>
            
            {showAdvancedOptions && (
              <div className="mt-4 space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>ℹ️</span>
                    Advanced Options Guide
                  </h5>
                  <p className="text-sm text-blue-700">
                    These settings are for fine-tuning your system. Default values work for most projects. 
                    Modify only if you have specific technical requirements.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Battery Chemistry
                      <span className="text-xs text-gray-500 ml-2">(affects cost & performance)</span>
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>LiFePO4 (Recommended for most projects)</option>
                      <option>Li-ion NMC (Higher density)</option>
                      <option>Li-ion LTO (Long cycle life)</option>
                    </select>
                    <div className="text-xs text-gray-600">
                      💡 LiFePO4 offers best cost/safety balance
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Depth of Discharge (%)
                      <span className="text-xs text-gray-500 ml-2">(usable capacity)</span>
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="90"
                      min="70"
                      max="100"
                    />
                    <div className="text-xs text-gray-600">
                      💡 90% is optimal for most lithium systems
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowAdvancedOptions(false)}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Apply Advanced Settings
                  </button>
                </div>
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">AI Assistant</h3>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">LIVE</span>
          </div>
          
          <div className="space-y-4">
            {/* Dynamic Recommendations based on configuration */}
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 mb-2 font-semibold">� Project Analysis</div>
              <div className="text-sm text-gray-800">
                <strong>{applicationType.charAt(0).toUpperCase() + applicationType.slice(1)}</strong> project: 
                {energyCapacity}{energyUnit} capacity with {powerRating}{powerUnit} output
                {powerRating > 0 && (
                  <div className="mt-1 text-xs text-blue-600">
                    Duration: {(energyCapacity / powerRating).toFixed(1)} hours at full power
                  </div>
                )}
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="p-3 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-2 font-semibold">💡 Smart Recommendations</div>
              <div className="text-sm text-gray-800">
                {applicationType === 'residential' && (
                  "For home installations, consider Tesla Powerwall or Enphase IQ series for reliability and warranty."
                )}
                {applicationType === 'commercial' && (
                  "Commercial projects benefit from modular systems. Consider LFP chemistry for cost-effectiveness."
                )}
                {applicationType === 'utility' && (
                  "Utility-scale projects should focus on LCOE optimization. Consider container-based solutions."
                )}
                {applicationType === 'ups' && (
                  "UPS systems require fast response (<4ms). Consider Li-ion with high-rate discharge capability for critical loads."
                )}
              </div>
            </div>
            
            {/* Cost Optimization */}
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 mb-2 font-semibold">🎯 Cost Optimization</div>
              <div className="text-sm text-gray-800">
                {energyCapacity > 1000 ? (
                  "Large systems qualify for bulk pricing. Estimated 15-25% savings possible."
                ) : energyCapacity > 100 ? (
                  "Medium-scale project. Consider financing options and tax incentives."
                ) : (
                  "Residential scale qualifies for federal tax credits up to 30%."
                )}
              </div>
            </div>

            {/* Market Intelligence */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <div className="text-sm text-amber-600 mb-2 font-semibold">📈 Market Intelligence</div>
              <div className="text-sm text-gray-800">
                Similar {applicationType} projects averaging $
                {applicationType === 'residential' ? '800-1200' : 
                 applicationType === 'commercial' ? '600-900' : '400-600'}
                /{energyUnit === 'MWh' ? 'MWh' : 'kWh'} installed
              </div>
            </div>
            
            <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-colors">
              🎯 Get Detailed AI Analysis
            </button>
            
            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors text-sm">
              💬 Chat with AI Assistant
            </button>
          </div>
        </div>
        
        {/* Enhanced Quick Actions with Status Indicators */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              Ready for Next Steps
            </h4>
            {applicationType && energyCapacity > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Configuration Ready
              </span>
            )}
          </div>
          
          {!applicationType || energyCapacity === 0 ? (
            <div className="text-center py-4">
              <div className="text-gray-500 mb-2">⏳ Complete your basic configuration first</div>
              <div className="text-sm text-gray-400">
                {!applicationType && "→ Select an application type above"}
                {applicationType && energyCapacity === 0 && "→ Set your power requirements"}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={() => setShowAnalytics(true)}
                className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-colors border border-blue-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <div className="font-semibold text-blue-800">Advanced Analytics</div>
                      <div className="text-sm text-blue-600">ROI, payback, cashflow analysis</div>
                    </div>
                  </div>
                  <span className="text-blue-400">→</span>
                </div>
              </button>
              
              <button 
                onClick={() => setShowTemplates(true)}
                className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-colors border border-green-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <div className="font-semibold text-green-800">Generate Quote</div>
                      <div className="text-sm text-green-600">Professional proposal document</div>
                    </div>
                  </div>
                  <span className="text-green-400">→</span>
                </div>
              </button>
              
              <button className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-colors border border-purple-200 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💾</span>
                    <div>
                      <div className="font-semibold text-purple-800">Save Configuration</div>
                      <div className="text-sm text-purple-600">Store for future reference</div>
                    </div>
                  </div>
                  <span className="text-purple-400">→</span>
                </div>
              </button>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-800">
                  <span className="font-semibold">💡 Recommended:</span> Start with Advanced Analytics to see cost breakdowns and ROI projections for your {applicationType} project.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Effects and handlers go here
  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());
    
    // Load user layout preference
    const user = authService.getCurrentUser();
    if (user && user.preferences?.layoutPreference) {
      setUserLayoutPreference(user.preferences.layoutPreference);
    }
  }, []);

  // Check if user needs to complete profile after login
  useEffect(() => {
    if (isLoggedIn) {
      const user = authService.getCurrentUser();
      if (user && !user.profileCompleted) {
        setShowWelcomeModal(true);
      }
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    const user = authService.getCurrentUser();
    if (user && !user.profileCompleted) {
      setShowWelcomeModal(true);
    }
  };

  const handleProfileSetup = () => {
    setShowWelcomeModal(false);
    setShowAccountSetup(true);
  };

  const handleStartWizard = () => {
    setShowWelcomeModal(false);
    setShowSmartWizard(true);
  };

  const handleGoHome = () => {
    setShowWelcomeModal(false);
    // Mark profile as completed even if skipped
    const user = authService.getCurrentUser();
    if (user && !user.profileCompleted) {
      authService.updateUserProfile(user.id, { profileCompleted: true });
    }
  };

  const handleAdvancedQuoteBuilder = () => {
    console.log('🔥 Advanced Tools button clicked!');
    console.log('Current isLoggedIn:', isLoggedIn);
    console.log('Current showAdvancedQuoteBuilder:', showAdvancedQuoteBuilder);
    
    setShowAdvancedQuoteBuilder(true);
    console.log('🚀 Set showAdvancedQuoteBuilder to true');
  };

  const handleLayoutPreference = (preference: 'beginner' | 'advanced') => {
    setUserLayoutPreference(preference);
    setShowLayoutPreferenceModal(false);
    
    if (preference === 'advanced') {
      setShowAdvancedQuoteBuilder(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSaveLayoutPreference = (preference: 'beginner' | 'advanced') => {
    const user = authService.getCurrentUser();
    if (user) {
      authService.updateUserProfile(user.id, {
        preferences: {
          ...user.preferences,
          layoutPreference: preference
        }
      });
      setUserLayoutPreference(preference);
    }
  };

  const handleProfileComplete = (profileData: ProfileData) => {
    const user = authService.getCurrentUser();
    if (user) {
      authService.updateUserProfile(user.id, {
        jobTitle: profileData.jobTitle,
        company: profileData.companyName || user.company,
        preferences: profileData.preferences,
        profileCompleted: true,
      });
    }
  };

  const handleContinueToEnhancedProfile = () => {
    setShowAccountSetup(false);
    setIsFirstTimeProfile(true);
    setShowEnhancedProfile(true);
  };

  const handleEnhancedProfileClose = () => {
    setShowEnhancedProfile(false);
    setIsFirstTimeProfile(false);
  };
  
  // Exchange rates (relative to USD)
  const exchangeRates: { [key: string]: number } = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 149.50,
    'CNY': 7.24,
    'CAD': 1.36,
    'AUD': 1.53,
    'INR': 83.12,
    'BRL': 4.97,
    'MXN': 17.08,
    'KRW': 1337.50,
  };

  // Convert USD amount to selected currency
  const convertCurrency = (amountUSD: number): number => {
    return amountUSD * exchangeRates[currency];
  };

  const handleSaveProject = async () => {
    setShowSaveProjectModal(true);
  };

  const handleUploadProject = () => {
    // Create file input element to load JSON project file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // Load the project data
          loadProjectData(data);
          alert(`✅ Project "${data.project_name || 'Unnamed'}" uploaded successfully!`);
        } catch (error) {
          alert('❌ Error loading project file. Please check the file format.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCreateWithWizard = () => {
    setShowSmartWizard(true);
  };

  const handleSaveToPortfolio = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please sign in to save projects');
      return;
    }

    // Create quote object with all current values
    const quote = {
      id: Date.now().toString(),
      user_id: token,
      project_name: quoteName,
      inputs: {
        powerMW,
        standbyHours,
        gridMode,
        useCase,
        generatorMW,
        solarMWp,
        windMW,
        valueKwh,
        utilization,
        warranty,
        location,
        currency
      },
      assumptions: {
        batteryKwh,
        pcsKw,
        bosPercent,
        epcPercent,
        offGridPcsFactor,
        onGridPcsFactor,
        genKw,
        solarKwp,
        windKw
      },
      outputs: {
        // Store calculated values for display in portfolio
        totalMWh: powerMW * standbyHours,
        bessCapEx: 0, // Will be recalculated when loaded
        gridMode,
        useCase
      },
      tags: useCase,
      notes: '',
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Load existing quotes
    const savedQuotes = localStorage.getItem('merlin_quotes');
    const allQuotes = savedQuotes ? JSON.parse(savedQuotes) : [];
    
    // Add new quote
    allQuotes.push(quote);
    
    // Save back to localStorage
    localStorage.setItem('merlin_quotes', JSON.stringify(allQuotes));
    
    alert(`✅ Project "${quoteName}" saved successfully!`);
    
    // Trigger portfolio refresh event
    window.dispatchEvent(new Event('portfolio-refresh'));
  };

  const handleLoadProject = () => {
    setShowLoadProjectModal(true);
  };

  const handleUploadFromComputer = () => {
    // Create file input element to load JSON/CSV project file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // Load the project data
          loadProjectData(data);
          
          // Ask if they want to save to cloud (requires login)
          if (!isLoggedIn) {
            const shouldLogin = confirm('Project loaded! Would you like to sign up/sign in to save it to the cloud?');
            if (shouldLogin) {
              setShowAuthModal(true);
            }
          }
        } catch (error) {
          alert('❌ Error loading project file. Please check the file format.');
          console.error('Load error:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const loadProjectData = (data: any) => {
    // Load all project data
    setQuoteName(data.quoteName || 'My BESS Project');
    setPowerMW(data.powerMW || 1);
    setStandbyHours(data.standbyHours || 2);
    setGridMode(data.gridMode || 'On-grid');
    setUseCase(data.useCase || 'EV Charging Stations');
    setGeneratorMW(data.generatorMW || 0);
    setSolarMWp(data.solarMWp || 0);
    setWindMW(data.windMW || 0);
    setValueKwh(data.valueKwh || 0.25);
    setUtilization(data.utilization || 0.3);
    setWarranty(data.warranty || '10 years');
    setLocation(data.location || 'UK (6%)');
    setCurrency(data.currency || 'USD');
    setBatteryKwh(data.batteryKwh || 140);
    setPcsKw(data.pcsKw || 150);
    setBosPercent(data.bosPercent || 0.12);
    setEpcPercent(data.epcPercent || 0.15);
    setOffGridPcsFactor(data.offGridPcsFactor || 1.25);
    setOnGridPcsFactor(data.onGridPcsFactor || 1);
    setGenKw(data.genKw || 300);
    setSolarKwp(data.solarKwp || 0);
    setWindKw(data.windKw || 1200);
    
    alert(`✅ Project "${data.quoteName || 'Unnamed'}" loaded successfully!`);
  };

  const handleUploadFromPortfolio = () => {
    setShowPortfolio(true);
  };

  const loadProjectFromStorage = (quote: any) => {
    const projectData = localStorage.getItem(`merlin_project_${quote.project_name}`);
    if (!projectData) {
      alert('❌ Project not found!');
      return;
    }
    
    const data = JSON.parse(projectData);
    setQuoteName(data.quoteName || quoteName);
    setPowerMW(data.powerMW || 1);
    setStandbyHours(data.standbyHours || 2);
    setGridMode(data.gridMode || 'On-grid');
    setUseCase(data.useCase || 'EV Charging Stations');
    setGeneratorMW(data.generatorMW || 0);
    setSolarMWp(data.solarMWp || 0);
    setWindMW(data.windMW || 0);
    setValueKwh(data.valueKwh || 0.25);
    setUtilization(data.utilization || 0.3);
    setWarranty(data.warranty || '10 years');
    setLocation(data.location || 'UK (6%)');
    setBatteryKwh(data.batteryKwh || 140);
    setPcsKw(data.pcsKw || 150);
    setBosPercent(data.bosPercent || 0.12);
    setEpcPercent(data.epcPercent || 0.15);
    setOffGridPcsFactor(data.offGridPcsFactor || 1.25);
    setOnGridPcsFactor(data.onGridPcsFactor || 1);
    setGenKw(data.genKw || 300);
    setSolarKwp(data.solarKwp || 0);
    setWindKw(data.windKw || 1200);
    
    alert(`✅ Project "${quote.project_name}" loaded successfully!`);
    setShowPortfolio(false);
  };

  const handlePortfolio = () => {
    if (isLoggedIn) {
      setShowPortfolio(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleUserProfile = () => {
    if (isLoggedIn) {
      // If logged in, show the profile viewer (not edit mode)
      setShowEnhancedProfile(true);
    } else {
      // If not logged in, show auth modal for sign in / join
      setShowAuthModal(true);
    }
  };

  const handleResetToDefaults = () => {
    // Reset all values to initial defaults
    setBatteryKwh(140);
    setPcsKw(150);
    setSolarKwp(0);
    setWindKw(1200);
    setGenKw(300);
    setBosPercent(0.12);
    setEpcPercent(0.15);
    setOffGridPcsFactor(1.25);
    setOnGridPcsFactor(1.0);
    setTariffPercent(0.10);
    
    // Show confirmation
    alert(
      `🔄 Values Reset to Industry Standards!\n\n` +
      `Battery: $140/kWh (Small Scale)\n` +
      `PCS: $150/kW (Standard)\n` +
      `Off-Grid PCS Factor: 1.25\n` +
      `On-Grid PCS Factor: 1.0\n` +
      `Solar: $1,000/kWp (Commercial)\n` +
      `Wind: $1,200/kW (Utility)\n` +
      `Generator: $300/kW (Diesel)\n` +
      `BoS: 12% (Industry Standard)\n` +
      `EPC: 15% (Industry Standard)\n` +
      `Tariffs: 10%\n\n` +
      `All pricing based on Q4 2025 market data`
    );
  };

  const handleExportCalculations = () => {
    try {
      const calculations = generateCalculationBreakdown(
        powerMW,
        standbyHours,
        solarMWp,
        windMW,
        generatorMW,
        batteryKwh,
        pcsKw,
        bosPercent,
        epcPercent,
        genKw,
        solarKwp,
        windKw,
        location
      );

      const textContent = exportCalculationsToText(calculations);
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${quoteName}_Calculations_${new Date().toISOString().split('T')[0]}.txt`);
      
      alert('✅ Calculation formulas exported successfully!\n\nThis file shows every formula, variable, and assumption used in your quote.');
    } catch (error) {
      console.error('Error exporting calculations:', error);
      alert('❌ Failed to export calculations. Please try again.');
    }
  };

  const handleApplyTemplate = (template: UseCaseTemplate) => {
    setPowerMW(template.configuration.powerMW);
    setStandbyHours(template.configuration.durationHours);
    setGridMode(template.configuration.gridMode);
    setGeneratorMW(template.configuration.generatorMW || 0);
    setSolarMWp(template.configuration.solarMW || 0);
    setWindMW(template.configuration.windMW || 0);
    setUtilization(template.configuration.utilization);
    setWarranty(template.configuration.warranty);
    setShowTemplates(false);
  };

  const handleExportWord = async () => {
    console.log('🚀 Export to Word button clicked!');
    
    // Play magical sound effect
    try {
      const audio = new Audio(magicPoofSound);
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Sound file error:', err);
    }
    
    try {
      const totalMWh = powerMW * standbyHours;
      const pcsKW = powerMW * 1000;
      
      // Dynamic pricing based on system size (industry standards)
      let adjustedBatteryPrice = batteryKwh;
      let adjustedPcsPrice = pcsKw;
      
      // Large scale pricing adjustments (economies of scale)
      if (powerMW >= 5) {
        // Large scale (≥5MW): Use utility-scale pricing
        adjustedBatteryPrice = Math.min(batteryKwh, 120); // BNEF large scale rate
        adjustedPcsPrice = Math.min(pcsKw, 140); // Bulk PCS pricing
      } else if (powerMW >= 2) {
        // Medium scale (≥2MW): Moderate discount
        adjustedBatteryPrice = Math.min(batteryKwh, 130);
        adjustedPcsPrice = Math.min(pcsKw, 145);
      }
      // Small scale (<2MW): Use default pricing
      
      const batterySubtotal = totalMWh * 1000 * adjustedBatteryPrice;
      const pcsSubtotal = pcsKW * adjustedPcsPrice;
      const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
      const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
      const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
      
      const generatorSubtotal = generatorMW * 1000 * genKw;
      const solarSubtotal = solarMWp * 1000 * (solarKwp / 1000);
      const windSubtotal = windMW * 1000 * (windKw / 1000);
      
      const batteryTariff = bessCapEx * 0.21;
      const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
      const totalTariffs = batteryTariff + otherTariff;
      
      const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
      
      // Use same realistic ROI calculation
      const utilityData = UTILITY_RATES['United States'];
      const dailyCycles = 1;
      const annualEnergyMWh = totalMWh * dailyCycles * 365;
      const peakShavingValue = (utilityData.peakRateKWh - utilityData.offPeakRateKWh);
      const peakShavingSavings = annualEnergyMWh * 1000 * peakShavingValue * 0.7;
      const demandChargeSavings = (powerMW * 1000) * utilityData.demandChargeKW * 12;
      const annualSavings = peakShavingSavings + demandChargeSavings;
      const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : Infinity;

      // Generate calculation breakdown for appendix
      const calculations = generateCalculationBreakdown(
        powerMW,
        standbyHours,
        solarMWp,
        windMW,
        generatorMW,
        batteryKwh,
        pcsKw,
        bosPercent,
        epcPercent,
        genKw,
        solarKwp,
        windKw,
        location
      );
      console.log('📊 Generated calculations for appendix:', calculations.length, 'items');
      console.log('First calculation:', calculations[0]);
      console.log('About to create main content...');

      // Main document content
      const mainContent = [
        // Professional Header Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "BATTERY ENERGY STORAGE SYSTEM",
                          bold: true,
                          size: 32,
                          color: "1E3A8A", // Dark blue matching site
                          font: "Helvetica",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "COMMERCIAL QUOTE PROPOSAL",
                          bold: true,
                          size: 24,
                          color: "2563EB", // Blue-600 matching site
                          font: "Helvetica",
                        }),
                      ],
                      spacing: { before: 100 },
                    }),
                  ],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  margins: { top: 200, bottom: 200, left: 200, right: 100 },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: "🧙‍♂️",
                          bold: true,
                          size: 72, // Much bigger icon
                          font: "Helvetica",
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: "MERLIN",
                          bold: true,
                          size: 32,
                          color: "9333EA", // Purple-600 matching site
                          font: "Helvetica",
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: "Energy Storage Solutions",
                          italics: true,
                          size: 18,
                          color: "6B7280",
                          font: "Helvetica",
                        }),
                      ],
                      spacing: { before: 50 },
                    }),
                  ],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  margins: { top: 200, bottom: 200, left: 100, right: 200 },
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ text: "", spacing: { after: 400 } }),

        // PROJECT INFORMATION Header
        new Paragraph({
          children: [
            new TextRun({
              text: "PROJECT INFORMATION",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Project Info Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Client Name:")] }),
                new TableCell({ children: [new Paragraph("Client Name")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Project Name:")] }),
                new TableCell({ children: [new Paragraph(quoteName)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Quote Date:")] }),
                new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Location:")] }),
                new TableCell({ children: [new Paragraph(location)] }),
              ],
            }),
          ],
        }),

        // 1. EXECUTIVE SUMMARY
        new Paragraph({
          children: [
            new TextRun({
              text: "1. EXECUTIVE SUMMARY",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Paragraph({
          text: "This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.",
          spacing: { after: 300 },
        }),

        // Key Metrics Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createHeaderRow(["METRIC", "VALUE"], "9333EA"), // Purple-600
            createDataRow(["System Capacity", `${totalMWh.toFixed(1)} MWh`]),
            createDataRow(["Power Rating", `${powerMW} MW`]),
            createDataRow(["Total Investment", `${getCurrencySymbol()}${grandCapEx.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]),
            createDataRow(["Annual Savings", `${getCurrencySymbol()}${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Payback Period")] }),
                new TableCell({ 
                  children: [boldParagraph(`${roiYears.toFixed(2)} years`)],
                  shading: { fill: "FCD34D" }, // Amber-300
                }),
              ],
            }),
          ],
        }),

        // 2. PROJECT OVERVIEW & VISUALIZATION
        new Paragraph({
          children: [
            new TextRun({
              text: "2. PROJECT OVERVIEW & VISUALIZATION",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Paragraph({
          text: "The proposed system integrates with your existing infrastructure to provide energy storage, peak shaving, and grid stabilization.",
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Project Site Layout & Configuration:",
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "📷 PROJECT SITE PHOTO",
                          bold: true,
                        }),
                      ],
                      spacing: { before: 400, after: 200 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "[Insert aerial or ground-level photo of installation site]",
                          italics: true,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 400 },
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "🔧 SYSTEM DIAGRAM",
                          bold: true,
                        }),
                      ],
                      spacing: { before: 400, after: 200 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "[Insert technical diagram showing BESS configuration and connections]",
                          italics: true,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 400 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 3. TECHNICAL SPECIFICATIONS & PRICING
        new Paragraph({
          children: [
            new TextRun({
              text: "3. TECHNICAL SPECIFICATIONS & PRICING",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createHeaderRow(["COMPONENT", "SPECIFICATION", "COST (USD)"], "2563EB"), // Blue-600
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Battery System")] }),
                new TableCell({ children: [new Paragraph(`${totalMWh.toFixed(1)} MWh LFP Chemistry`)] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${batterySubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Power Conversion")] }),
                new TableCell({ children: [new Paragraph(`${pcsKW.toLocaleString()} kW Bi-directional Inverter`)] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${pcsSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Balance of System")] }),
                new TableCell({ children: [new Paragraph("Enclosures, Cabling, Protection")] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${bosAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Engineering & Installation")] }),
                new TableCell({ children: [new Paragraph("EPC Services, Commissioning")] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${epcAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            }),
            ...(solarMWp > 0 ? [new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Solar Array")] }),
                new TableCell({ children: [new Paragraph(`${solarMWp} MWp + Inverters`)] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${solarSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            })] : []),
            ...(generatorMW > 0 ? [new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Generator Backup")] }),
                new TableCell({ children: [new Paragraph(`${generatorMW} MW Natural Gas/Diesel`)] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${generatorSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            })] : []),
            new TableRow({
              children: [
                new TableCell({ 
                  children: [boldParagraph("SYSTEM SUBTOTAL")],
                  shading: { fill: "E7E6E6" },
                }),
                new TableCell({ 
                  children: [new Paragraph("")],
                  shading: { fill: "E7E6E6" },
                }),
                new TableCell({ 
                  children: [boldParagraph(`${getCurrencySymbol()}${bessCapEx.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)],
                  shading: { fill: "E7E6E6" },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [boldParagraph("Taxes & Tariffs")] }),
                new TableCell({ children: [new Paragraph("Import duties, local taxes")] }),
                new TableCell({ children: [new Paragraph(`${getCurrencySymbol()}${totalTariffs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ 
                  children: [boldParagraph("GRAND TOTAL")],
                  shading: { fill: "F59E0B" }, // Amber-500
                }),
                new TableCell({ 
                  children: [new Paragraph("")],
                  shading: { fill: "F59E0B" }, // Amber-500
                }),
                new TableCell({ 
                  children: [boldParagraph(`${getCurrencySymbol()}${grandCapEx.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)],
                  shading: { fill: "F59E0B" }, // Amber-500
                }),
              ],
            }),
          ],
        }),

        // 4. FINANCIAL ANALYSIS & ROI
        new Paragraph({
          children: [
            new TextRun({
              text: "4. FINANCIAL ANALYSIS & ROI",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createHeaderRow(["FINANCIAL METRIC", "VALUE"], "9333EA"), // Purple-600
            createDataRow(["Annual Energy Savings", `${getCurrencySymbol()}${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]),
            createDataRow(["Simple Payback Period", `${roiYears.toFixed(2)} years`]),
            createDataRow(["System Utilization", `20%`]),
          ],
        }),

        // 5. IMPLEMENTATION & CERTIFICATIONS
        new Paragraph({
          children: [
            new TextRun({
              text: "5. IMPLEMENTATION & CERTIFICATIONS",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Project Timeline: ",
              bold: true,
            }),
            new TextRun({
              text: "12-16 weeks from contract execution to commissioning",
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Required Certifications: ",
              bold: true,
            }),
            new TextRun({
              text: "UL9540A, IEEE 1547",
            }),
          ],
          spacing: { after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Warranty Period: ",
              bold: true,
            }),
            new TextRun({
              text: `${warranty === '10' ? '10 years' : warranty === '15' ? '15 years' : warranty === '20' ? '20 years' : warranty} comprehensive system warranty`,
            }),
          ],
          spacing: { after: 300 },
        }),

        // 6. SUMMARY & NEXT STEPS
        new Paragraph({
          children: [
            new TextRun({
              text: "6. SUMMARY & NEXT STEPS",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 500, after: 200 },
        }),

        new Paragraph({
          text: "This Battery Energy Storage System provides an optimal solution for your energy requirements with strong financial returns and proven technology. The proposed system will deliver reliable energy storage, grid stabilization, and significant cost savings over its operational lifetime.",
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Key Benefits:",
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: "• Peak demand reduction and energy cost optimization",
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "• Grid stabilization and power quality improvement",
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "• Backup power capability during outages",
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: "• Reduced carbon footprint and sustainability goals",
          bullet: { level: 0 },
          spacing: { after: 300 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "This proposal is valid for 30 days. Please contact us to discuss next steps and begin the implementation process.",
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: "",
          spacing: { after: 400 },
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Confidential & Proprietary",
              italics: true,
              color: "999999",
            }),
          ],
        }),
      ];

      // APPENDIX: Calculation Reference
      console.log('Creating appendix content...');
      console.log('📊 Calculations to convert:', calculations);
      console.log('📊 Number of calculations:', calculations.length);
      const calcTables = createCalculationTables(calculations);
      console.log('Calculation tables created:', calcTables.length, 'elements');
      console.log('📋 First few table elements:', calcTables.slice(0, 3));
      
      const appendixContent = [
        new Paragraph({
          text: "",
          children: [new PageBreak()],
        }),
        new Paragraph({
          text: "APPENDIX A: CALCULATION REFERENCE",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          text: "This appendix provides the formulas used in this quote. All calculations are based on industry-standard methodologies and current market data (Q4 2025).",
          spacing: { after: 300 },
        }),
        
        // Add calculation tables using helper function
        ...calcTables,
        
        // Data Sources
        new Paragraph({
          text: "Data Sources & References",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• NREL ATB 2024 - Utility-Scale Battery Storage: ", bold: true }),
            new TextRun({
              text: "https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage",
              style: "Hyperlink",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• BloombergNEF - Li-ion Battery Pack Prices 2024: ", bold: true }),
            new TextRun({
              text: "https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/",
              style: "Hyperlink",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• HighJoule BESS Cost Guide 2024-2025: ", bold: true }),
            new TextRun({
              text: "https://www.highjoule.com/blog/battery-energy-storage-system-bess-costs-in-2024-2025-the-ultimate-guide-to-lcos-market-trends.html",
              style: "Hyperlink",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Catalyst Power - Microgrid Installation Costs: ", bold: true }),
            new TextRun({
              text: "https://blog.catalystpower.com/more-power-to-you/what-are-the-upfront-costs-of-installing-a-microgrid-system",
              style: "Hyperlink",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• ComEd Hourly Pricing (Real-Time Rates): ", bold: true }),
            new TextRun({
              text: "https://hourlypricing.comed.com/live-prices/",
              style: "Hyperlink",
            }),
          ],
          spacing: { after: 200 },
        }),
        italicParagraph("Last Updated: Q4 2025", {
          spacing: { before: 200 },
        }),
      ];

      console.log('📄 Appendix content created:', appendixContent.length, 'elements');
      console.log('📝 Main content:', mainContent.length, 'elements');

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Helvetica",
              },
            },
          },
        },
        sections: [{
          properties: {},
          children: [...mainContent, ...appendixContent],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteName.replace(/[^a-z0-9]/gi, '_')}_BESS_Quote.docx`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert(`✅ Professional BESS Quote generated successfully!\n\n"${quoteName}_BESS_Quote.docx"\n\nIncludes:\n• Project Information\n• Executive Summary\n• Project Overview & Visualization\n• Technical Specifications & Pricing\n• Financial Analysis & ROI\n• Implementation & Certifications\n• Summary & Next Steps\n• Appendix A: Calculation Formulas`);
    } catch (error) {
      console.error('❌ Word export error:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`❌ Word export failed. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // CALCULATIONS
  const totalMWh = powerMW * standbyHours;
  const pcsKW = powerMW * 1000;
  const actualPcsFactor = gridMode === 'Off-grid' ? offGridPcsFactor : onGridPcsFactor;
  const adjustedPcsKw = pcsKW * actualPcsFactor;
  
  // Use dynamic pricing system based on market data
  const dynamicPricing = calculateBESSPricing(powerMW, standbyHours, selectedCountry, false);
  const dynamicBatteryKwh = dynamicPricing.contractAveragePerKWh;
  
  // Use dynamic pricing unless manually overridden to a much higher value
  const effectiveBatteryKwh = batteryKwh > 160 ? batteryKwh : dynamicBatteryKwh;
  
  const batterySubtotal = totalMWh * 1000 * effectiveBatteryKwh;
  const pcsSubtotal = pcsKW * pcsKw;
  const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
  const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  const generatorSubtotal = generatorMW * 1000 * genKw;
  const solarSubtotal = solarMWp * 1000 * (solarKwp / 1000);
  const windSubtotal = windMW * 1000 * (windKw / 1000);
  
  const batteryTariff = bessCapEx * 0.21;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
  const totalTariffs = batteryTariff + otherTariff;
  
  const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  
  // Use realistic utility rates for ROI calculation
  const utilityData = UTILITY_RATES['United States']; // Default to US rates
  const dailyCycles = 1; // 1 full charge/discharge cycle per day
  const annualEnergyMWh = totalMWh * dailyCycles * 365;
  
  // Peak shaving savings: arbitrage between peak and off-peak
  const peakShavingValue = (utilityData.peakRateKWh - utilityData.offPeakRateKWh);
  const peakShavingSavings = annualEnergyMWh * 1000 * peakShavingValue * 0.7; // 70% peak offset
  
  // Demand charge reduction: avoid peak demand charges
  const demandChargeSavings = (powerMW * 1000) * utilityData.demandChargeKW * 12;
  
  const annualSavings = peakShavingSavings + demandChargeSavings;
  const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : Infinity;

  const inputStyle = "w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50";
  const labelStyle = "block text-base font-semibold text-gray-800 mb-2 tracking-wide";
  const cardStyle = "bg-gradient-to-b from-white via-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-8 shadow-xl relative overflow-hidden";

  // Currency symbol helper
  const getCurrencySymbol = () => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'INR': '₹',
      'BRL': 'R$',
      'MXN': 'MX$',
      'KRW': '₩',
    };
    return symbols[currency] || '$';
  };

  // Show About page if active
  if (showAbout) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => setShowAbout(false)}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              ✨ Join Now
            </button>
          </div>
        </div>
        <AboutMerlin onStartWizard={() => {
          setShowAbout(false);
          setShowSmartWizard(true);
        }} />
      </div>
    );
  }

  // Show Vendor Portal if active
  if (showVendorPortal) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => setShowVendorPortal(false)}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              ✨ Join Customer Platform
            </button>
          </div>
        </div>
        <VendorPortal />
      </div>
    );
  }

  // If showing advanced quote builder
  if (showAdvancedQuoteBuilder) {
    console.log('✅ Rendering advanced quote builder interface');
    console.log('showAdvancedQuoteBuilder value:', showAdvancedQuoteBuilder);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Advanced Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">⚡ Advanced Quote Builder</h1>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Power User Mode</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowAdvancedQuoteBuilder(false);
                  setShowSmartWizard(true);
                }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                🎯 Smart Wizard Option
              </button>
              <button
                onClick={() => setShowAdvancedQuoteBuilder(false)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Quote Builder Content - Scrollable to main form */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Quick Actions Header */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 border-b">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">Advanced Configuration</h2>
                  <div className="flex gap-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">AI Available</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Full Control</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTemplates(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    📋 Templates
                  </button>
                  <button 
                    onClick={() => setShowAnalytics(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    📊 Analytics
                  </button>
                  <button 
                    onClick={() => setShowFinancing(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🎯 Financing
                  </button>
                </div>
              </div>
            </div>

            {/* Scroll to main quote builder form */}
            <div className="h-screen overflow-y-auto">
              {/* Main form content will be rendered here */}
              {renderMainQuoteForm()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main className="p-8">
        {/* Energy News Ticker - Matches hero width */}
        <div className="my-6">
          <EnergyNewsTicker />
        </div>
        
        {/* NEW CUSTOMER-FOCUSED HERO SECTION */}
        <section className="my-6 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400 bg-gradient-to-br from-white via-purple-50 to-blue-100">
          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-12">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-600/20 animate-pulse"></div>
            
            {/* Top Right Buttons - Customer Focused */}
            <div className="absolute top-6 right-6 z-20 flex gap-3">
              <button 
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-white/20 transition-colors border border-white/30"
                onClick={() => setShowAbout(true)}
              >
                About Merlin
              </button>
              <button 
                className="bg-gradient-to-b from-blue-100 to-blue-200 text-blue-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:from-blue-200 hover:to-blue-300 transition-colors border-2 border-blue-300"
                onClick={() => setShowJoinModal(true)}
              >
                ✨ Join Now
              </button>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Side - Content */}
              <div className="lg:col-span-8 text-left">
                <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
                  Cut Energy Costs. Earn Revenue. Go Green.
                </h1>
                <p className="text-2xl mb-8 font-light">
                  Get a custom energy storage quote in 3 minutes
                </p>
                
                {/* Smart Wizard Benefits */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/20">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-3xl">🎯</span>
                    Smart Wizard Benefits:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-bold text-lg">See Your Savings</p>
                        <p className="text-sm text-white/80">Instant ROI calculation with payback timeline</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-bold text-lg">Personalized Configuration</p>
                        <p className="text-sm text-white/80">Sized perfectly for your energy needs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-bold text-lg">Compare Options</p>
                        <p className="text-sm text-white/80">Installation, shipping & financing side-by-side</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-bold text-lg">Download Your Quote</p>
                        <p className="text-sm text-white/80">PDF & Excel formats ready to share</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Primary CTAs - Smart Wizard & Advanced Tools */}
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                  {/* Smart Wizard Button */}
                  <div className="relative inline-block">
                    {/* Glow effect behind button */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-70 animate-pulse"></div>
                    
                    <button 
                      onClick={() => setShowSmartWizard(true)}
                      className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white px-12 py-5 rounded-3xl font-extrabold text-2xl shadow-2xl border-4 border-cyan-300 hover:scale-105 transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl animate-bounce">🎯</span>
                        <div className="text-left">
                          <div className="text-2xl">Smart Wizard</div>
                          <div className="text-xs font-normal text-cyan-100 mt-1">7 simple steps • 3 minutes • No signup</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Advanced Quote Builder Button */}
                  <div className="relative inline-block">
                    {/* Glow effect behind button */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                    
                    <button 
                      onClick={() => {
                        console.log('🎯 Button clicked!');
                        console.log('About to set showAdvancedQuoteBuilder to true');
                        setShowAdvancedQuoteBuilder(true);
                      }}
                      className="relative bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl border-2 border-amber-300 hover:scale-105 transition-transform z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        <div className="text-left">
                          <div className="text-lg">Advanced Tools</div>
                          <div className="text-xs font-normal text-amber-100 mt-1">Power users • Full control</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Merlin Mascot */}
              <div className="lg:col-span-4 flex justify-center items-center">
                <div className="relative">
                  {/* Glow effect behind Merlin */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 via-purple-400/50 to-blue-400/50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                  
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border-4 border-white/30 shadow-2xl">
                    <img 
                      src={merlinImage} 
                      alt="Merlin - Your Energy Advisor" 
                      className="w-64 h-64 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] filter brightness-110"
                    />
                    <div className="mt-4 text-center">
                      <p className="text-lg font-light italic opacity-90 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        "Let me guide you to the perfect energy solution"
                      </p>
                      <p className="text-sm font-bold mt-2 text-cyan-200">
                        - Merlin, Your Energy Advisor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
            {/* Cost Savings Card */}
            <div 
              onClick={() => setShowCostSavingsModal(true)}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
            >
              <div className="text-5xl mb-4 text-center">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Reduce Energy Costs</h3>
              <p className="text-gray-600 mb-4 text-center">
                Cut your electricity bills by 30-50% with smart energy storage and peak shaving
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Store cheap off-peak energy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Avoid expensive peak rates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Reduce demand charges</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Lower utility bills permanently</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <span className="text-3xl font-bold text-green-600">$50K+</span>
                <p className="text-sm text-gray-500">Average annual savings</p>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-green-700 transition-colors">
                  <span className="text-lg">🎯</span>
                  Explore Cost Savings
                </div>
              </div>
            </div>

            {/* Revenue Generation Card */}
            <div 
              onClick={() => setShowRevenueModal(true)}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
            >
              <div className="text-5xl mb-4 text-center">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Generate Revenue</h3>
              <p className="text-gray-600 mb-4 text-center">
                Turn your battery into a profit center with grid services and energy arbitrage
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Frequency regulation services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Demand response programs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Energy arbitrage opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Capacity market payments</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <span className="text-3xl font-bold text-blue-600">3-5 year</span>
                <p className="text-sm text-gray-500">Typical ROI timeline</p>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">
                  <span className="text-lg">🎯</span>
                  Explore Revenue
                </div>
              </div>
            </div>

            {/* Sustainability Card */}
            <div 
              onClick={() => setShowSustainabilityModal(true)}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
            >
              <div className="text-5xl mb-4 text-center">�</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Achieve Sustainability</h3>
              <p className="text-gray-600 mb-4 text-center">
                Meet your environmental goals and qualify for valuable tax incentives
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>Reduce carbon footprint</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>Maximize solar/wind usage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>30% Federal tax credit (ITC)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>State & local incentives</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <span className="text-3xl font-bold text-emerald-600">Net Zero</span>
                <p className="text-sm text-gray-500">Energy independence ready</p>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-emerald-700 transition-colors">
                  <span className="text-lg">🎯</span>
                  Explore Sustainability
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXAMPLE CONFIGURATIONS SECTION - Use Case ROI Showcase */}
        <section className="my-8">
          {/* Section Header - Tightened */}
          <div className="text-center mb-6">
            <div className="inline-block mb-2">
              <span className="text-4xl">�</span>
            </div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 mb-2">
              Real-World Applications
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              See how businesses are using energy storage to 
              <span className="text-green-600 font-bold"> reduce costs</span>, 
              <span className="text-blue-600 font-bold"> generate revenue</span>, and 
              <span className="text-purple-600 font-bold"> go green</span>
            </p>
          </div>

          {/* Use Case Showcase - Enhanced Visual Design */}
          <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-2xl border-2 border-blue-200 p-10">
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
          <UseCaseROI 
            autoRotate={true}
            rotationInterval={10000}
            onLoadTemplate={(useCase: UseCaseData) => {
              // Calculate costs based on use case specifications
              const useCasePowerMW = useCase.systemSizeMW;
              const useCaseDuration = useCase.duration;
              const useCaseMWh = useCase.systemSizeMWh;
              
              // Use dynamic pricing for this use case
              const useCasePricing = calculateBESSPricing(useCasePowerMW, useCaseDuration, selectedCountry, false);
              const useCaseBatteryKwh = useCasePricing.contractAveragePerKWh;
              
              // Calculate all cost components
              const batterySystemCost = useCaseMWh * 1000 * useCaseBatteryKwh;
              const pcsKW = useCasePowerMW * 1000;
              const pcsCost = pcsKW * pcsKw; // PCS already includes inverter functionality
              const transformersCost = pcsKW * 50; // Standard $50/kW for transformers
              const switchgearCost = pcsKW * 35; // Reduced $35/kW for switchgear (more realistic)
              
              // Scale microgrid controls cost based on system size
              const microgridControlsCost = Math.min(50000, Math.max(15000, useCasePowerMW * 8000)); // $15k-50k based on size
              
              const equipmentSubtotal = batterySystemCost + pcsCost + transformersCost + switchgearCost + microgridControlsCost;
              const bosCost = equipmentSubtotal * bosPercent;
              const epcCost = (equipmentSubtotal + bosCost) * epcPercent;
              const tariffsCost = (batterySystemCost + pcsCost) * 0.21; // 21% battery tariff
              const shippingCost = equipmentSubtotal * 0.05; // Estimate 5% for shipping
              
              const grandTotalCost = equipmentSubtotal + bosCost + epcCost + tariffsCost + shippingCost;
              
              // Build complete quote object matching QuotePreviewModal interface
              const quote = {
                clientName: 'Prospective Client',
                projectName: `${useCase.industry} BESS Project`,
                bessPowerMW: useCasePowerMW,
                duration: useCaseDuration,
                batteryMWh: useCaseMWh,
                solarMW: 0,
                windMW: 0,
                generatorMW: 0,
                gridConnection: 'On-grid',
                application: useCase.industry,
                location: selectedCountry,
                tariffRegion: selectedCountry,
                shippingDestination: selectedCountry,
                projectTimeframe: '12-18 months',
                primaryGoal: `Peak shaving and demand charge reduction for ${useCase.industry}`,
                warranty: '10 years',
                pcsIncluded: true,
                costs: {
                  batterySystem: Math.round(batterySystemCost),
                  pcs: Math.round(pcsCost),
                  transformers: Math.round(transformersCost),
                  switchgear: Math.round(switchgearCost),
                  microgridControls: Math.round(microgridControlsCost),
                  solar: 0,
                  solarInverters: 0,
                  wind: 0,
                  windConverters: 0,
                  generator: 0,
                  generatorControls: 0,
                  bos: Math.round(bosCost),
                  epc: Math.round(epcCost),
                  tariffs: Math.round(tariffsCost),
                  shipping: Math.round(shippingCost),
                  grandTotal: Math.round(grandTotalCost),
                },
                annualSavings: useCase.totalAnnualSavings,
                paybackPeriod: useCase.paybackYears,
                budget: Math.round(grandTotalCost * 1.1), // 10% buffer
              };
              
              // Store quote and show preview modal with download options
              setCurrentQuote(quote);
              setShowQuotePreview(true);
            }}
          />
            </div>
          </div>
        </section>

        {/* Quote Preview Modal for Use Case ROI */}
        {showQuotePreview && currentQuote && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}>
            <QuotePreviewModal
              isOpen={showQuotePreview}
              onClose={() => setShowQuotePreview(false)}
              quoteData={currentQuote}
            />
          </div>
        )}

        {/* Advanced Quote Builder Toggle - Show only when not already shown */}
        {!showAdvancedQuoteBuilder && (
          <section className="my-6">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
              {/* Advanced Quote Builder Button */}
              <button
                onClick={() => setShowAdvancedQuoteBuilder(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl transition-all inline-flex items-center gap-4"
              >
                <span className="text-3xl">🎯</span>
                <div className="text-left">
                  <div>Advanced Quote Builder</div>
                  <div className="text-sm font-normal opacity-90">Customize every detail of your system</div>
                </div>
              </button>

              {/* Vendor & Contact Buttons */}
              <div className="flex gap-3">
                <button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                  onClick={() => setShowVendorPortal(true)}
                >
                  <span className="text-xl">🏢</span>
                  <div className="text-left">
                    <div className="text-sm">Vendor Portal</div>
                    <div className="text-xs opacity-90">For suppliers & partners</div>
                  </div>
                </button>
                <a 
                  href="mailto:info@merlinenergy.com"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span className="text-xl">📧</span>
                  <div className="text-left">
                    <div className="text-sm">Contact Us</div>
                    <div className="text-xs opacity-90">Get in touch</div>
                  </div>
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">For technical users who want full control over pricing and configuration</p>
          </section>
        )}

        {/* Technical Quote Building Sections - Only shown in Advanced Mode */}
        {showAdvancedQuoteBuilder && (
          <>
            {/* Back to Simple View Button */}
            <section className="my-6 text-center">
              <button
                onClick={() => setShowAdvancedQuoteBuilder(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Simple View</span>
              </button>
            </section>

            {/* Project Management Section - Only in Advanced Mode */}
            <section className="my-6 rounded-2xl p-6 shadow-xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Project Management</h3>
              <div className="flex justify-center items-center space-x-4">
                <input 
                  type="text" 
                  placeholder="My BESS Project"
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  className={`${inputStyle} w-64 text-center`}
                />
                
                <button 
                  className="bg-gradient-to-b from-gray-200 to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-blue-400 flex items-center justify-center space-x-2"
                  onClick={handleSaveProject}
                >
                  <span className="text-xl">💾</span>
                  <span>Save</span>
                </button>
                
                <button 
                  className="bg-gradient-to-b from-green-400 to-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-green-800 flex items-center justify-center space-x-2"
                  onClick={handleLoadProject}
                >
                  <span className="text-xl">📂</span>
                  <span>Load</span>
                </button>
                
                <button 
                  className="bg-gradient-to-b from-purple-600 to-purple-800 text-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-purple-900 flex items-center justify-center space-x-2"
                  onClick={handlePortfolio}
                >
                  <span>📊</span>
                  <span>Portfolio</span>
                </button>
              </div>
            </section>

            {/* Main Quote Form */}
            {renderMainQuoteForm()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT AND MIDDLE COLUMNS */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SYSTEM CONFIGURATION PANEL */}
            <section className="rounded-2xl p-8 shadow-2xl border-2 border-purple-300 bg-gradient-to-b from-purple-50 via-purple-100 to-white relative overflow-hidden">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">System Configuration</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelStyle}>Power (MW)</label>
                  <input type="number" step="0.1" value={powerMW} onChange={(e) => setPowerMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Duration (hours)</label>
                  <select value={standbyHours} onChange={(e) => setStandbyHours(parseFloat(e.target.value) || 2)} className={inputStyle}>
                    <option value="0.5">0.5 hours (UPS applications)</option>
                    <option value="1">1 hour (Short backup)</option>
                    <option value="2">2 hours (Standard grid support)</option>
                    <option value="3">3 hours (Extended grid support)</option>
                    <option value="4">4 hours (Long duration storage)</option>
                    <option value="6">6 hours (Extended backup)</option>
                    <option value="8">8 hours (Overnight storage)</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    💡 Most BESS projects use 2-4 hours. Use longer durations only for specialized applications.
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Grid Mode</label>
                  <select value={gridMode} onChange={(e) => setGridMode(e.target.value)} className={inputStyle}>
                    <option>On-grid</option>
                    <option>Off-grid</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Generator (MW)</label>
                  <input type="number" step="0.1" value={generatorMW} onChange={(e) => setGeneratorMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Solar (MWp) - Optional</label>
                  <input type="number" step="0.1" value={solarMWp} onChange={(e) => setSolarMWp(parseFloat(e.target.value) || 0)} className={inputStyle} placeholder="0 (Battery only)" />
                  {solarMWp > 0 && (
                    <div className="text-xs text-amber-600 mt-1 p-2 bg-amber-50 rounded border border-amber-200">
                      ⚠️ {solarMWp}MW solar requires ~{(solarMWp * 100000 / 43560).toFixed(1)} acres of roof/land space. 
                      Verify your facility can support this before including in quote.
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    💡 Solar is optional - many BESS projects work great without it. Only add if you have adequate space and want renewable generation.
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Wind (MW)</label>
                  <input type="number" step="0.1" value={windMW} onChange={(e) => setWindMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Utilization Rate (%)</label>
                  <input type="number" step="1" value={utilization * 100} onChange={(e) => setUtilization((parseFloat(e.target.value) || 0) / 100)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Use Case</label>
                  <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className={inputStyle}>
                    <option>EV Charging Stations</option>
                    <option>Data Centers</option>
                    <option>Manufacturing</option>
                    <option>Commercial Buildings</option>
                    <option>Utilities</option>
                  </select>
                </div>
                 <div>
                  <label className={labelStyle}>Warranty</label>
                  <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className={inputStyle}>
                    <option>5 years</option>
                    <option>10 years</option>
                    <option>15 years</option>
                    <option>20 years</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ASSUMPTIONS PANEL */}
            <section className="rounded-2xl p-8 shadow-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 via-blue-100 to-white relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">Pricing Assumptions</h2>
                <button
                  onClick={handleResetToDefaults}
                  className="bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition-colors duration-200 border-b-4 border-orange-700 hover:border-orange-800 flex items-center space-x-2"
                  title="Reset all values to default settings"
                >
                  <span className="text-sm">🔄</span>
                  <span>Reset</span>
                </button>
              </div>
              
              {/* Dynamic Pricing Info Box */}
              <div className="mb-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border-2 border-green-400">
                <p className="text-sm font-bold text-gray-800 mb-2">💡 Dynamic Market Pricing Active</p>
                <p className="text-xs text-gray-700">
                  Battery pricing auto-adjusts based on system size, duration, and location.
                  Current rate: <strong className="text-blue-700">${effectiveBatteryKwh}/kWh</strong>
                  {' '}({powerMW >= 2 ? 'Large Scale ≥2MW' : 'Small Scale <2MW'})
                </p>
                <p className="text-xs text-green-700 font-semibold mt-1">
                  ✅ Based on BNEF 2024, NREL ATB, and industry contracts
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelStyle}>
                    Battery ({getCurrencySymbol()}/kWh)
                    <span className="text-xs text-blue-600 ml-2">📊 Auto</span>
                  </label>
                  <input 
                    type="number" 
                    step="1" 
                    value={effectiveBatteryKwh} 
                    onChange={(e) => setBatteryKwh(parseFloat(e.target.value) || 0)} 
                    className={inputStyle}
                    title="Automatically calculated from market data. You can override manually."
                  />
                </div>
                <div>
                  <label className={labelStyle}>PCS ({getCurrencySymbol()}/kW)</label>
                  <input type="number" step="1" value={pcsKw} onChange={(e) => setPcsKw(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>BOS (%)</label>
                  <input type="number" step="1" value={(bosPercent * 100).toFixed(0)} onChange={(e) => setBosPercent((parseFloat(e.target.value) || 0) / 100)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>EPC (%)</label>
                  <input type="number" step="1" value={(epcPercent * 100).toFixed(0)} onChange={(e) => setEpcPercent((parseFloat(e.target.value) || 0) / 100)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Off-Grid PCS Factor</label>
                  <input type="number" step="0.01" value={offGridPcsFactor} onChange={(e) => setOffGridPcsFactor(parseFloat(e.target.value) || 1.25)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>On-Grid PCS Factor</label>
                  <input type="number" step="0.01" value={onGridPcsFactor} onChange={(e) => setOnGridPcsFactor(parseFloat(e.target.value) || 1)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Gen ({getCurrencySymbol()}/kW)</label>
                  <input type="number" step="1" value={genKw} onChange={(e) => setGenKw(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Solar ({getCurrencySymbol()}/kWp)</label>
                  <input type="number" step="1" value={solarKwp} onChange={(e) => setSolarKwp(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Wind ({getCurrencySymbol()}/kW)</label>
                  <input type="number" step="1" value={windKw} onChange={(e) => setWindKw(parseFloat(e.target.value) || 0)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Battery Tariff (%)</label>
                  <input type="number" step="1" value="21" disabled className={inputStyle + " opacity-60"} title="Fixed at 21% for battery systems" />
                </div>
                <div>
                  <label className={labelStyle}>Other Equipment Tariff (%)</label>
                  <input type="number" step="1" value="6" disabled className={inputStyle + " opacity-60"} title="Fixed at 6% for solar, wind, and generators" />
                </div>
              </div>
              
              {/* Upload Pricing Data Button - Below Input Fields */}
              <div className="mt-8 pt-6 border-t-2 border-blue-300">
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center">📊 Contribute to Market Intelligence</p>
                <button
                  onClick={() => {
                    console.log('📊 Upload Pricing Data clicked');
                    setShowPricingDataCapture(true);
                  }}
                  className="w-full bg-gradient-to-br from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-emerald-700 transition-colors duration-200 flex items-center justify-center gap-3"
                  title="Upload your pricing data to improve market intelligence and earn credits"
                >
                  <span className="text-2xl">📊</span>
                  <div className="text-center">
                    <div className="text-base font-bold">Upload Pricing Data</div>
                    <div className="text-sm opacity-90">Contribute & Earn Credits</div>
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* FINANCIAL SUMMARY PANEL */}
            <section className="rounded-2xl p-8 shadow-2xl border-2 border-green-300 bg-gradient-to-b from-green-50 to-white relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-green-800 mb-8">Financial Summary</h2>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-2 bg-white border-2 border-green-400 rounded-xl text-gray-800 font-bold focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-300 shadow-md"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="MXN">MXN (MX$)</option>
                  <option value="KRW">KRW (₩)</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-lg">BESS CapEx:</span>
                  <span className="font-bold text-green-700 text-2xl">{getCurrencySymbol()}{convertCurrency(bessCapEx).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-lg">Grand CapEx:</span>
                  <span className="font-bold text-green-800 text-2xl">{getCurrencySymbol()}{convertCurrency(grandCapEx).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <hr className="border-green-300 my-4" />
                <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-lg">Annual Savings:</span>
                  <span className="font-bold text-yellow-700 text-2xl">{getCurrencySymbol()}{convertCurrency(annualSavings).toLocaleString(undefined, {maximumFractionDigits: 0})}/yr</span>
                </div>
                <div className="bg-yellow-100 p-4 rounded-xl border-2 border-yellow-300 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold text-lg">Simple ROI:</span>
                  <span className="font-bold text-orange-700 text-2xl">{roiYears.toFixed(2)} years</span>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-green-400/30"
                  onClick={handleExportWord}
                >
                  📄 Export to Word
                </button>
                <button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-blue-400/30"
                  onClick={() => setShowCalculationModal(true)}
                  title="View detailed formulas and assumptions"
                >
                  🧮 View Calculation Details
                </button>
                <button 
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-purple-400/30"
                  onClick={handleExportCalculations}
                  title="Export detailed formulas to text file"
                >
                  💾 Export Formulas (TXT)
                </button>
                <div className="mt-6 pt-6 border-t-2 border-green-200">
                  <p className="text-sm text-gray-600 font-semibold mb-3 text-center">Advanced Tools</p>
                  <div className="space-y-3">
                    <button 
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-cyan-400/30"
                      onClick={() => setShowAnalytics(true)}
                      title="NPV, IRR, ROI, and sensitivity analysis"
                    >
                      📊 Advanced Analytics
                    </button>
                    <button 
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-emerald-400/30"
                      onClick={() => setShowFinancing(true)}
                      title="Compare loan, lease, and PPA options"
                    >
                      🎯 Financing Calculator
                    </button>
                    <button 
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-violet-400/30"
                      onClick={() => setShowTemplates(true)}
                      title="Pre-configured BESS templates for common use cases"
                    >
                      🎯 Use Case Templates
                    </button>
                  </div>
                </div>

                {/* Quote Customization Section */}
                <div className="mt-6 pt-6 border-t-2 border-blue-200">
                  <p className="text-sm text-gray-600 font-semibold mb-3 text-center">Quote Customization</p>
                  <div className="space-y-3">
                    <button 
                      className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-sky-300/30"
                      onClick={() => setShowUtilityRates(true)}
                      title="Select regional utility rates for accurate pricing"
                    >
                      ⚡ Regional Utility Rates
                    </button>
                    <button 
                      className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-gray-300/30"
                      onClick={() => setShowQuoteTemplates(true)}
                      title="Customize quote templates for different project types"
                    >
                      📋 Quote Templates
                    </button>
                    <button 
                      className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-gray-300/30"
                      onClick={() => setShowPricingPresets(true)}
                      title="Save your pricing presets & EPC contractor fees"
                    >
                      🎯 My Pricing Presets
                    </button>
                    <button 
                      className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-purple-400/30 relative"
                      onClick={() => setShowReviewWorkflow(true)}
                      title="Manage quote review and approval workflow"
                    >
                      <span>✓ Review Workflow</span>
                      {currentQuoteStatus !== 'draft' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded capitalize">
                          {currentQuoteStatus}
                        </span>
                      )}
                      {currentQuoteStatus === 'in-review' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
                      )}
                      {currentQuoteStatus === 'approved' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SYSTEM DETAILS PANEL */}
            <section className="rounded-2xl p-8 shadow-2xl border-2 border-cyan-300 bg-gradient-to-b from-cyan-50 via-blue-50 to-white relative overflow-hidden">
              <h2 className="text-3xl font-bold text-cyan-800 mb-6">System Details</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 flex justify-between items-center">
                  <span className="text-gray-800 font-semibold text-lg">Total Energy:</span>
                  <span className="font-bold text-blue-700 text-2xl">{totalMWh.toFixed(2)} MWh</span>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 flex justify-between items-center">
                  <span className="text-gray-800 font-semibold text-lg">PCS Power:</span>
                  <span className="font-bold text-blue-800 text-2xl">{pcsKW.toFixed(2)} kW</span>
                </div>
                <div className="bg-cyan-50 p-4 rounded-xl border-2 border-cyan-200 flex justify-between items-center">
                  <span className="text-gray-800 font-semibold text-lg">Annual Energy:</span>
                  <span className="font-bold text-cyan-700 text-2xl">{annualEnergyMWh.toFixed(2)} MWh</span>
                </div>
              </div>
            </section>
          </div>
        </div>
        </>
      )}

      {/* Footer with Admin Access */}
        <footer className="mt-12 border-t border-purple-300 pt-8 pb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setShowStatusPage(true)}
                className="text-gray-600 hover:text-green-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🟢</span>
                <span>System Status</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-gray-600 hover:text-blue-600 text-xs font-medium transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowTermsOfService(true)}
                className="text-gray-600 hover:text-purple-600 text-xs font-medium transition-colors"
              >
                Terms of Service
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowSecuritySettings(true)}
                className="text-gray-600 hover:text-green-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🔒</span>
                <span>Security & Privacy</span>
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              © 2025 Merlin Energy. All rights reserved.
            </p>
            {isLoggedIn && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowSystemHealth(true)}
                  className="text-gray-600 hover:text-blue-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>📊</span>
                  <span>System Health</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setShowVendorManager(true)}
                  className="text-gray-600 hover:text-purple-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>🔧</span>
                  <span>Admin Panel</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    alert('You have been logged out successfully');
                  }}
                  className="text-gray-600 hover:text-red-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </footer>
      </main>

      {/* Modals */}
      {showUserProfile && (
        <EditableUserProfile 
          onClose={() => setShowUserProfile(false)} 
          onLoginSuccess={handleLoginSuccess} 
          onLogout={() => setIsLoggedIn(false)} 
          isLoggedIn={isLoggedIn}
          onShowQuoteTemplates={() => setShowQuoteTemplates(true)}
          onShowPricingPresets={() => setShowPricingPresets(true)}
          onShowVendorLeads={() => setShowVendorSponsorship(true)}
        />
      )}
      {showPortfolio && <Portfolio onClose={() => setShowPortfolio(false)} onLoadQuote={loadProjectFromStorage} />}
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
      {showVendorManager && <VendorManager isOpen={showVendorManager} onClose={() => setShowVendorManager(false)} />}
      {showPricingPlans && (
        <PricingPlans 
          onClose={() => setShowPricingPlans(false)} 
          onSignUp={() => {
            setShowPricingPlans(false);
            setShowAuthModal(true);
          }}
          currentTier="free" 
        />
      )}
      
      {/* Welcome and Account Setup Modals */}
      {showWelcomeModal && (
        <WelcomeModal
          onClose={handleGoHome}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          onSetupProfile={handleProfileSetup}
          onStartWizard={handleStartWizard}
          onGoHome={handleGoHome}
        />
      )}
      {showAccountSetup && (
        <AccountSetup
          onClose={() => setShowAccountSetup(false)}
          onComplete={handleProfileComplete}
          onContinueToProfile={handleContinueToEnhancedProfile}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          accountType={authService.getCurrentUser()?.accountType || 'individual'}
          companyName={authService.getCurrentUser()?.company}
        />
      )}
      {showEnhancedProfile && (
        <EnhancedProfile
          onClose={handleEnhancedProfileClose}
          isFirstTime={isFirstTimeProfile}
        />
      )}
  
      {/* Join Merlin Modal - Shows benefits first */}
      <JoinMerlinModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onViewPricing={() => {
          setShowJoinModal(false);
          setShowPricingPlans(true);
        }}
      />
      
      <SmartWizard
        show={showSmartWizard}
        onClose={() => setShowSmartWizard(false)}
        onFinish={(wizardData) => {
          // Map wizard data to the main form
          setPowerMW(wizardData.storageSizeMW || 1);
          setStandbyHours(wizardData.durationHours || 2);
          
          // Map application to use case
          const applicationMap: { [key: string]: string } = {
            'ev-charging': 'EV Charging Stations',
            'data-center': 'Data Centers',
            'manufacturing': 'Manufacturing',
            'commercial': 'Commercial Buildings',
            'utility': 'Utility Scale',
            'resiliency': 'Critical Infrastructure',
          };
          setUseCase(applicationMap[wizardData.primaryApplication] || 'EV Charging Stations');
          
          // Set warranty
          setWarranty(`${wizardData.warranty} years`);
          
          // Set renewable energy and generator values from wizard
          setSolarMWp(wizardData.solarMW || 0);
          setWindMW(wizardData.windMW || 0);
          setGeneratorMW(wizardData.generatorMW || 0);
          
          // Close wizard and show success message
          setShowSmartWizard(false);
          
          // Scroll to top to show the updated configuration
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          // Show success notification
          setTimeout(() => {
            alert(`🎉 Configuration Applied Successfully!\n\n` +
                  `BESS Power: ${wizardData.power} MW\n` +
                  `Duration: ${wizardData.duration} hours\n` +
                  `Solar: ${wizardData.solarMW || 0} MW\n` +
                  `Wind: ${wizardData.windMW || 0} MW\n` +
                  `Generator: ${wizardData.generatorMW || 0} MW\n` +
                  `Grid: ${wizardData.gridConnection === 'behind' ? 'Behind the meter' : 'Front of meter'}\n` +
                  `Application: ${applicationMap[wizardData.primaryApplication]}\n\n` +
                  `Your quote has been updated. Review the details below and click "Generate Quote" when ready.`);
          }, 500);
        }}
      />

      {/* Calculation Modal */}
      {showCalculationModal && (
        <CalculationModal
          isOpen={showCalculationModal}
          onClose={() => setShowCalculationModal(false)}
          calculations={generateCalculationBreakdown(
            powerMW,
            standbyHours,
            solarMWp,
            windMW,
            generatorMW,
            batteryKwh,
            pcsKw,
            bosPercent,
            epcPercent,
            genKw,
            solarKwp,
            windKw,
            location
          )}
          projectName={quoteName}
        />
      )}

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={showSaveProjectModal}
        onClose={() => setShowSaveProjectModal(false)}
        onUploadProject={handleUploadProject}
        onCreateWithWizard={handleCreateWithWizard}
      />

      {/* Load Project Modal */}
      <LoadProjectModal
        isOpen={showLoadProjectModal}
        onClose={() => setShowLoadProjectModal(false)}
        onUploadFromComputer={handleUploadFromComputer}
        onUploadFromPortfolio={handleUploadFromPortfolio}
      />

      {/* Advanced Analytics Modal */}
      {showAnalytics && (
        <AdvancedAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          projectData={{
            quoteName,
            powerMW,
            durationHours: standbyHours,
            totalCapEx: grandCapEx,
            annualSavings,
          }}
        />
      )}

      {/* Financing Calculator Modal */}
      {showFinancing && (
        <FinancingCalculator
          isOpen={showFinancing}
          onClose={() => setShowFinancing(false)}
          projectData={{
            quoteName,
            totalCapEx: grandCapEx,
            annualSavings,
            powerMW,
            durationHours: standbyHours,
          }}
        />
      )}

      {/* Use Case Templates Modal */}
      {showTemplates && (
        <UseCaseTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* Pricing Data Capture Modal */}
      {showPricingDataCapture && (
        <PricingDataCapture
          onClose={() => setShowPricingDataCapture(false)}
          userEmail={authService.getCurrentUser()?.email}
        />
      )}

      {/* Market Intelligence Dashboard */}
      {showMarketIntelligence && (
        <MarketIntelligenceDashboard
          onClose={() => setShowMarketIntelligence(false)}
          userTier={authService.getCurrentUser()?.tier as 'free' | 'professional' | 'enterprise_pro' | 'business'}
        />
      )}

      {/* Vendor Sponsorship Marketplace */}
      {showVendorSponsorship && (
        <VendorSponsorship
          onClose={() => setShowVendorSponsorship(false)}
        />
      )}

      {/* Privacy Policy */}
      {showPrivacyPolicy && (
        <PrivacyPolicy
          onClose={() => setShowPrivacyPolicy(false)}
        />
      )}

      {/* Terms of Service */}
      {showTermsOfService && (
        <TermsOfService
          onClose={() => setShowTermsOfService(false)}
        />
      )}

      {/* Security & Privacy Settings */}
      {showSecuritySettings && (
        <SecurityPrivacySettings
          onClose={() => setShowSecuritySettings(false)}
        />
      )}

      {/* System Health Dashboard */}
      {showSystemHealth && (
        <SystemHealth
          onClose={() => setShowSystemHealth(false)}
        />
      )}

      {/* Public Status Page */}
      {showStatusPage && (
        <StatusPage
          onClose={() => setShowStatusPage(false)}
        />
      )}

      {/* Utility Rates Manager */}
      {showUtilityRates && (
        <UtilityRatesManager
          onClose={() => setShowUtilityRates(false)}
          onSelectRate={(rate, rateType) => {
            // Apply selected utility rate to the quote
            const selectedRate = rateType === 'residential' ? rate.residentialRate :
                                rateType === 'commercial' ? rate.commercialRate :
                                rate.industrialRate;
            setValueKwh(selectedRate);
            alert(`Utility rate updated to $${selectedRate.toFixed(3)}/kWh from ${rate.utility}`);
          }}
          currentRate={valueKwh}
        />
      )}

      {/* Quote Templates */}
      {showQuoteTemplates && (
        <QuoteTemplates
          onClose={() => setShowQuoteTemplates(false)}
          onSelectTemplate={(template) => {
            alert(`Template "${template.name}" selected! Quote generation will use this template.`);
            // Template will be used when generating the quote document
          }}
          userId={authService.getCurrentUser()?.email || 'guest'}
        />
      )}

      {/* Pricing Presets */}
      {showPricingPresets && (
        <PricingPresets
          onClose={() => setShowPricingPresets(false)}
          onSelectPreset={(preset) => {
            // Apply preset pricing to quote builder
            alert(`Pricing preset "${preset.name}" applied!\n\nBattery: $${preset.battery.pricePerKWh}/kWh\nInverter: $${preset.inverter.pricePerKW}/kW\n${preset.epc.enabled ? 'EPC fees included' : ''}`);
            // Pricing will be applied to calculations
          }}
          userId={authService.getCurrentUser()?.email || 'guest'}
        />
      )}

      {/* Quote Review Workflow */}
      {showReviewWorkflow && (
        <QuoteReviewWorkflow
          onClose={() => setShowReviewWorkflow(false)}
          quoteId={`quote-${quoteName.replace(/\s+/g, '-').toLowerCase()}`}
          quoteName={quoteName}
          userId={authService.getCurrentUser()?.email || 'guest'}
          userName={authService.getCurrentUser()?.email || 'Guest User'}
          onStatusChange={(status) => {
            setCurrentQuoteStatus(status);
          }}
        />
      )}

      {/* Cost Savings Benefits Modal */}
      {showCostSavingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">🎯 Reduce Energy Costs</h2>
                <button 
                  onClick={() => setShowCostSavingsModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold"
                >×</button>
              </div>
            </div>
            <div className="p-8">
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                Energy storage systems help you dramatically reduce electricity costs by storing energy when it's cheap and using it when prices are high.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h4 className="font-bold text-green-900 mb-2">Peak Shaving</h4>
                  <p className="text-gray-700">Store energy during off-peak hours (when electricity is cheap) and discharge during peak hours (when rates are highest). Save 30-50% on peak energy charges.</p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h4 className="font-bold text-green-900 mb-2">Demand Charge Reduction</h4>
                  <p className="text-gray-700">Reduce your peak demand by supplementing grid power with battery power. Commercial customers can save thousands per month on demand charges alone.</p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h4 className="font-bold text-green-900 mb-2">Time-of-Use Optimization</h4>
                  <p className="text-gray-700">Automatically shift your energy consumption to the lowest-cost periods, maximizing savings without any operational changes.</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-World Savings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">$50,000+</div>
                  <p className="text-gray-600">Average annual savings for manufacturing facilities</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">30-50%</div>
                  <p className="text-gray-600">Reduction in peak energy charges</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">$0.10-0.25</div>
                  <p className="text-gray-600">Savings per kWh with arbitrage</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">4-7 years</div>
                  <p className="text-gray-600">Typical payback period</p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <p className="text-gray-700"><strong>Example:</strong> A 2 MW / 4 MWh system for a manufacturing facility can save $50,000-$100,000 annually through peak shaving and demand charge reduction alone.</p>
              </div>

              <button 
                onClick={() => {
                  setShowCostSavingsModal(false);
                  setShowSmartWizard(true);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🎯</span>
                Calculate Your Savings with Smart Wizard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Generation Benefits Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">🎯 Generate Revenue</h2>
                <button 
                  onClick={() => setShowRevenueModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold"
                >×</button>
              </div>
            </div>
            <div className="p-8">
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                Transform your energy storage system from a cost-saving tool into an active revenue generator by participating in grid services and energy markets.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Revenue Streams</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-bold text-blue-900 mb-2">Frequency Regulation</h4>
                  <p className="text-gray-700">Get paid to help stabilize the electric grid by providing fast-response power. Earn $10-50/kW-year depending on your market.</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-bold text-blue-900 mb-2">Demand Response Programs</h4>
                  <p className="text-gray-700">Utilities pay you to reduce consumption during peak events. Typical payments: $50-200/kW-year.</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-bold text-blue-900 mb-2">Energy Arbitrage</h4>
                  <p className="text-gray-700">Buy low, sell high. Charge when electricity is cheap, discharge when prices spike. Can generate $20-100/kWh-year.</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-bold text-blue-900 mb-2">Capacity Markets</h4>
                  <p className="text-gray-700">Get paid simply for having capacity available when the grid needs it. Steady income stream of $30-150/kW-year.</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Revenue Potential</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">$100K-300K</div>
                  <p className="text-gray-600">Annual revenue for 5 MW system in ERCOT</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">3-5 years</div>
                  <p className="text-gray-600">Typical ROI with stacked revenue</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15-25%</div>
                  <p className="text-gray-600">IRR for well-optimized systems</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">Multiple</div>
                  <p className="text-gray-600">Stack 3-5 revenue streams simultaneously</p>
                </div>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
                <p className="text-gray-700"><strong>Best Markets:</strong> ERCOT (Texas), CAISO (California), PJM (Mid-Atlantic), and ISO-NE (New England) offer the most lucrative opportunities for battery storage revenue.</p>
              </div>

              <button 
                onClick={() => {
                  setShowRevenueModal(false);
                  setShowSmartWizard(true);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🎯</span>
                Model Your Revenue with Smart Wizard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sustainability Benefits Modal */}
      {showSustainabilityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">🌱 Achieve Sustainability</h2>
                <button 
                  onClick={() => setShowSustainabilityModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold"
                >×</button>
              </div>
            </div>
            <div className="p-8">
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                Energy storage is essential for achieving net-zero goals, maximizing renewable energy use, and qualifying for valuable tax incentives.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Environmental Benefits</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
                  <h4 className="font-bold text-emerald-900 mb-2">Maximize Renewable Energy</h4>
                  <p className="text-gray-700">Store excess solar and wind energy for use when the sun isn't shining or wind isn't blowing. Increase renewable usage from 30% to 80%+.</p>
                </div>
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
                  <h4 className="font-bold text-emerald-900 mb-2">Reduce Carbon Footprint</h4>
                  <p className="text-gray-700">Offset fossil fuel consumption by using stored clean energy. A 2 MW / 4 MWh system can eliminate 500+ tons of CO₂ annually.</p>
                </div>
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
                  <h4 className="font-bold text-emerald-900 mb-2">Enable Grid Decarbonization</h4>
                  <p className="text-gray-700">Help integrate more renewable energy onto the grid by providing essential grid services and reducing curtailment.</p>
                </div>
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
                  <h4 className="font-bold text-emerald-900 mb-2">Energy Independence</h4>
                  <p className="text-gray-700">Combined with solar, achieve near-complete energy independence. Protect against outages while reducing grid reliance.</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Financial Incentives</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
                  <h4 className="font-bold text-green-900 mb-2 text-xl">30% Federal Investment Tax Credit (ITC)</h4>
                  <p className="text-gray-700 mb-2">Reduces your system cost by 30% when paired with solar. A $1M system becomes $700K after the credit.</p>
                  <p className="text-sm text-gray-600">Available through 2032, then phases down to 26% (2033), 22% (2034)</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Accelerated Depreciation (MACRS)</h4>
                  <p className="text-gray-700">Depreciate 85% of system value over 5 years. Additional $150K-300K in tax savings for typical commercial systems.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-900 mb-2">State & Local Incentives</h4>
                  <p className="text-gray-700">Many states offer additional rebates, grants, and incentives. California's SGIP program offers up to $200/kWh.</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Corporate Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">✓ ESG Reporting</div>
                  <p className="text-gray-600">Demonstrate environmental commitment to stakeholders</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Brand Value</div>
                  <p className="text-gray-600">Enhance reputation with sustainability leadership</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Future-Proof</div>
                  <p className="text-gray-600">Prepare for carbon pricing and regulations</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">✓ Certifications</div>
                  <p className="text-gray-600">Qualify for LEED, ENERGY STAR, and more</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSustainabilityModal(false);
                  setShowSmartWizard(true);
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-colors flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🎯</span>
                Calculate Your Environmental Impact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
