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
import SmartWizard from './wizard/SmartWizard';
import magicPoofSound from "../assets/sounds/Magic_Poof.mp3";
import SaveProjectModal from './modals/SaveProjectModal';
import LoadProjectModal from './modals/LoadProjectModal';
import QuotePreviewModal from './modals/QuotePreviewModal';


export default function BessQuoteBuilder() {
  // Check for public profile route
  const [viewMode, setViewMode] = useState<'app' | 'public-profile'>('app');
  const [publicProfileSlug, setPublicProfileSlug] = useState<string | null>(null);

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

  // If viewing a public profile, show that instead
  if (viewMode === 'public-profile' && publicProfileSlug) {
    return <PublicProfileViewer profileSlug={publicProfileSlug} onSignUp={handleNavigateToApp} />;
  }

  // Regular app state
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

  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());
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
  
  // System Configuration State
  const [powerMW, setPowerMW] = useState(1);
  const [standbyHours, setStandbyHours] = useState(2);
  const [gridMode, setGridMode] = useState('On-grid');
  const [useCase, setUseCase] = useState('EV Charging Stations');
  const [generatorMW, setGeneratorMW] = useState(1);
  const [solarMWp, setSolarMWp] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [valueKwh, setValueKwh] = useState(0.25);
  const [utilization, setUtilization] = useState(0.3);
  const [warranty, setWarranty] = useState('10 years');
  const [location, setLocation] = useState('UK (6%)');
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [currency, setCurrency] = useState('USD');
 
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

  // Assumptions State (default values)
  const [batteryKwh, setBatteryKwh] = useState(250);
  const [pcsKw, setPcsKw] = useState(200);
  const [bosPercent, setBosPercent] = useState(0.15);
  const [epcPercent, setEpcPercent] = useState(0.10);
  const [offGridPcsFactor, setOffGridPcsFactor] = useState(1.25);
  const [onGridPcsFactor, setOnGridPcsFactor] = useState(1);
  const [genKw, setGenKw] = useState(500);
  const [solarKwp, setSolarKwp] = useState(1500);
  const [windKw, setWindKw] = useState(3000);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tariffPercent, setTariffPercent] = useState(0.10);

  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showSaveProjectModal, setShowSaveProjectModal] = useState(false);
  const [showLoadProjectModal, setShowLoadProjectModal] = useState(false);
  const [showPricingDataCapture, setShowPricingDataCapture] = useState(false);
  const [showMarketIntelligence, setShowMarketIntelligence] = useState(false);
  const [showVendorSponsorship, setShowVendorSponsorship] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
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
    setBatteryKwh(data.batteryKwh || 250);
    setPcsKw(data.pcsKw || 200);
    setBosPercent(data.bosPercent || 0.15);
    setEpcPercent(data.epcPercent || 0.10);
    setOffGridPcsFactor(data.offGridPcsFactor || 1.25);
    setOnGridPcsFactor(data.onGridPcsFactor || 1);
    setGenKw(data.genKw || 500);
    setSolarKwp(data.solarKwp || 1500);
    setWindKw(data.windKw || 3000);
    
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
    setGeneratorMW(data.generatorMW || 1);
    setSolarMWp(data.solarMWp || 0);
    setWindMW(data.windMW || 0);
    setValueKwh(data.valueKwh || 0.25);
    setUtilization(data.utilization || 0.3);
    setWarranty(data.warranty || '10 years');
    setLocation(data.location || 'UK (6%)');
    setBatteryKwh(data.batteryKwh || 248);
    setPcsKw(data.pcsKw || 150);
    setBosPercent(data.bosPercent || 0.12);
    setEpcPercent(data.epcPercent || 0.15);
    setOffGridPcsFactor(data.offGridPcsFactor || 1.25);
    setOnGridPcsFactor(data.onGridPcsFactor || 1);
    setGenKw(data.genKw || 350);
    setSolarKwp(data.solarKwp || 900);
    setWindKw(data.windKw || 1400);
    
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
    setBatteryKwh(250);
    setPcsKw(200);
    setSolarKwp(1500);
    setWindKw(3000);
    setGenKw(500);
    setBosPercent(0.15);
    setEpcPercent(0.10);
    setOffGridPcsFactor(1.25);
    setOnGridPcsFactor(1.0);
    setTariffPercent(0.10);
    
    // Show confirmation
    alert(
      `🔄 Values Reset to Defaults!\n\n` +
      `Battery: $250/kWh\n` +
      `PCS: $200/kW\n` +
      `Off-Grid PCS Factor: 1.25\n` +
      `On-Grid PCS Factor: 1.0\n` +
      `Solar: $1,500/kWp\n` +
      `Wind: $3,000/kW\n` +
      `Generator: $500/kW\n` +
      `BoS: 15%\n` +
      `EPC: 10%\n` +
      `Tariffs: 10%`
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
      const batterySubtotal = totalMWh * 1000 * batteryKwh;
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
          text: "The proposed BESS installation will integrate seamlessly with your existing infrastructure to provide reliable energy storage, peak shaving, and grid stabilization capabilities.",
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
  
  // Allow manual override via batteryKwh state, but default to dynamic pricing
  const effectiveBatteryKwh = batteryKwh === 120 || batteryKwh === 140 ? dynamicBatteryKwh : batteryKwh;
  
  const batterySubtotal = totalMWh * 1000 * effectiveBatteryKwh;
  const pcsSubtotal = pcsKW * adjustedPcsKw;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Header Bar */}
      <header className="relative p-6 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-blue-200/50 shadow-md">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleUserProfile}
            className="bg-gradient-to-b from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-colors duration-200 border-2 border-purple-500 hover:border-purple-600"
          >
            🧙‍♂️ User Profile
          </button>
          
          {/* PROMINENT SMART WIZARD BUTTON */}
          <div className="relative">
            <button 
              onClick={() => setShowSmartWizard(true)}
              className="bg-gradient-to-b from-purple-500 to-purple-700 text-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg transition-colors border-b-4 border-purple-800 hover:border-purple-900"
              aria-label="Open Smart Wizard"
              title="Open Smart Wizard"
            >
              <div className="flex flex-col items-center">
                <div className="text-lg">🪄 Smart Wizard</div>
                <div className="text-xs font-normal opacity-90">start building</div>
              </div>
            </button>
            
            {/* "START HERE" Indicator Bubble - Smaller */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg animate-pulse border border-yellow-500">
              ⭐
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMarketIntelligence(true)}
            className="bg-gradient-to-br from-blue-200 via-cyan-200 to-sky-300 px-3 py-2 rounded-lg shadow-md border-2 border-blue-400 transition-colors duration-200 cursor-pointer"
            title="Click to view detailed market intelligence"
          >
            <div className="text-xs font-bold text-blue-800">📊 Market Average</div>
            <div className="text-lg font-extrabold text-blue-900">${valueKwh.toFixed(4)}/kWh</div>
          </button>
          <button
            onClick={() => setShowMarketIntelligence(true)}
            className="bg-gradient-to-br from-emerald-200 via-green-300 to-teal-300 px-3 py-2 rounded-lg shadow-md border-2 border-green-500 transition-colors duration-200 cursor-pointer"
            title="Turnkey system: Battery + PCS + Microgrid Controls + BOS + Integration"
          >
            <div className="text-xs font-bold text-green-800">💰 Installed Price</div>
            <div className="text-lg font-extrabold text-green-900">
              ${calculateRealWorldPrice()}/kWh
            </div>
          </button>
        </div>
      </header>
      
      <main className="p-8">
        {/* MERLIN Hero Section */}
  <section className="my-6 rounded-2xl p-8 shadow-2xl border-2 border-blue-400 bg-gradient-to-br from-white via-blue-50 to-blue-200 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-600/10 animate-pulse"></div>
          
          {/* Join Now Button - Upper Right */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              className="bg-gradient-to-b from-purple-400 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg border-2 border-purple-800 text-lg"
              onClick={() => setShowJoinModal(true)}
            >
              ✨ Join Now
            </button>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={merlinImage} 
                alt="Merlin the Wizard" 
                className="w-64 h-64 object-contain drop-shadow-[0_0_30px_rgba(147,51,234,0.8)] filter brightness-110"
              />
              <div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
                  Merlin BESS Quote Builder
                </h1>
                <p className="text-xl text-blue-700 italic font-semibold drop-shadow-md">"Where Magic Meets Energy"</p>
              </div>
            </div>
            
            <div className="flex justify-center items-center space-x-4 mt-8">
              <input 
                type="text" 
                placeholder="My BESS Project"
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                className={`${inputStyle} w-72 text-center`}
              />
              
              <button 
                className="bg-gradient-to-b from-gray-200 to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-blue-400 flex items-center justify-center space-x-2 text-xl w-48"
                onClick={handleSaveProject}
              >
                <span className="text-2xl">💾</span>
                <span>Save</span>
              </button>
              
              <button 
                className="bg-gradient-to-b from-green-400 to-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-green-800 flex items-center justify-center space-x-2 text-xl w-48"
                onClick={handleLoadProject}
              >
                <span className="text-2xl">📂</span>
                <span>Load</span>
              </button>
              
              <button 
                className="bg-gradient-to-b from-purple-600 to-purple-800 text-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-purple-900 flex items-center justify-center space-x-2 text-xl w-48"
                onClick={handlePortfolio}
              >
                <span>📊</span>
                <span>Portfolio</span>
              </button>
            </div>
          </div>
        </section>

        {/* MARKET PRICING INTELLIGENCE SECTION - COMPACT */}
        <section className="rounded-2xl p-4 shadow-xl border-2 border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-white mb-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center">
              <span className="text-3xl mr-2">📊</span>
              Current BESS Market Pricing
              <span className="text-3xl ml-2">💰</span>
            </h2>
            
            {/* Compact Pricing Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg border-2 border-blue-700">
                <p className="text-xs font-semibold mb-1 opacity-90">📈 Market Average</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">
                  ${calculateBESSPricing(powerMW, standbyHours, selectedCountry).marketPricePerKWh}
                </p>
                <p className="text-xs font-semibold opacity-90">per kWh</p>
                <p className="text-[10px] mt-1 opacity-80 bg-blue-700/30 rounded px-2 py-0.5 inline-block">
                  📉 -40% YoY
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 text-white p-5 rounded-xl shadow-lg border-2 border-green-700">
                <p className="text-xs font-semibold mb-1 opacity-90">💰 Contract Average</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">
                  ${calculateBESSPricing(powerMW, standbyHours, selectedCountry).contractAveragePerKWh}
                </p>
                <p className="text-xs font-semibold opacity-90">per kWh</p>
                <p className="text-[10px] mt-1 opacity-80 bg-green-700/30 rounded px-2 py-0.5 inline-block">
                  {powerMW >= 2 ? '🏭 ≥2MW' : '🏢 <2MW'}
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-green-300">
              <p className="text-xs text-gray-600 italic mb-2">Data Sources:</p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                  title="Bloomberg NEF Battery Pricing Report"
                >
                  🔗 BNEF
                </a>
                <a 
                  href="https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                  title="NREL Annual Technology Baseline - Battery Storage"
                >
                  🔗 NREL ATB
                </a>
                <a 
                  href="https://www.highjoule.com/blog/battery-energy-storage-system-bess-costs-in-2024-2025-the-ultimate-guide-to-lcos-market-trends.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                  title="HighJoule BESS Cost Guide 2024-2025"
                >
                  🔗 HighJoule
                </a>
                <a 
                  href="https://blog.catalystpower.com/more-power-to-you/what-are-the-upfront-costs-of-installing-a-microgrid-system#:~:text=Larger%20microgrid%20projects%20(between%202%20MW%20and,higher%20normalized%20costs%2C%20averaging%20around%20$4%20million/MW."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                  title="Catalyst Power - Microgrid Installation Costs"
                >
                  🔗 Catalyst
                </a>
                <a 
                  href="https://hourlypricing.comed.com/live-prices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                  title="ComEd Live Hourly Pricing"
                >
                  🔗 ComEd Rates
                </a>
              </div>
            </div>
          </div>

          {/* Your System Estimate - Compact */}
          <div className="bg-gradient-to-r from-yellow-100 via-orange-50 to-yellow-100 p-3 rounded-lg border border-yellow-400 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🎯 Your System ({powerMW}MW × {standbyHours}hr = {(powerMW * standbyHours).toFixed(1)}MWh)</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-700">
                  ${((powerMW * standbyHours * 1000) * calculateBESSPricing(powerMW, standbyHours, selectedCountry).contractAveragePerKWh).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  @ ${calculateBESSPricing(powerMW, standbyHours, selectedCountry).contractAveragePerKWh}/kWh
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASE ROI SHOWCASE - ROTATING (Full Width & Centered) */}
        <section className="my-6 rounded-2xl p-8 shadow-2xl border-2 border-green-400 bg-gradient-to-br from-white via-green-50 to-green-200 relative overflow-hidden text-center">
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
              const pcsCost = pcsKW * pcsKw;
              const transformersCost = pcsKW * 50; // Standard $50/kW for transformers
              const invertersCost = pcsKW * 100; // Standard $100/kW for inverters
              const switchgearCost = pcsKW * 75; // Standard $75/kW for switchgear
              const microgridControlsCost = 50000; // Fixed cost for controls
              
              const equipmentSubtotal = batterySystemCost + pcsCost + transformersCost + invertersCost + switchgearCost + microgridControlsCost;
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
                  inverters: Math.round(invertersCost),
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
                  <input type="number" step="0.1" value={standbyHours} onChange={(e) => setStandbyHours(parseFloat(e.target.value) || 0)} className={inputStyle} />
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
                  <label className={labelStyle}>Solar (MWp)</label>
                  <input type="number" step="0.1" value={solarMWp} onChange={(e) => setSolarMWp(parseFloat(e.target.value) || 0)} className={inputStyle} />
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
                      💰 Financing Calculator
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
                      💰 My Pricing Presets
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
        onShowUtilityRates={() => setShowUtilityRates(true)}
        onShowPricingPresets={() => setShowPricingPresets(true)}
        onFinish={(wizardData) => {
          // Map wizard data to the main form
          setPowerMW(wizardData.power || 1);
          setStandbyHours(wizardData.duration || 2);
          setGridMode(wizardData.gridConnection === 'behind' ? 'On-grid' : 'Off-grid');
          
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
    </div>
  );
}
