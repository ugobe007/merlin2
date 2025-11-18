import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Send, X, Save, AlertCircle } from 'lucide-react';
import { aiStateService, type AIState } from '../../services/aiStateService';
import ConsultationModal from '../modals/ConsultationModal';
import FinancingOptionsModal from './FinancingOptionsModal';
import InstallerDirectoryModal from './InstallerDirectoryModal';
import IncentivesGuideModal from './IncentivesGuideModal';
import LeadCaptureModal from './LeadCaptureModal';
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';
import { calculateDatabaseBaseline } from '../../services/baselineService';
import { supabase } from '../../services/supabaseClient';
import merlinImage from '../../assets/images/new_Merlin.png';
import wizardIcon from '../../assets/images/wizard_icon1.png';

interface QuoteCompletePageProps {
  quoteData: {
    // System configuration
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    location: string;
    industryTemplate: string | string[];
    electricityRate?: number;
    useCaseData?: Record<string, any>; // EV charger details, hotel rooms, etc.
    
    // Financial
    totalProjectCost: number;
    annualSavings: number;
    paybackYears: number;
    taxCredit: number;
    netCost: number;
    
    // Options selected
    installationOption: string;
    shippingOption: string;
    financingOption: string;
  };
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onDownloadWord: () => void;
  onEmailQuote: (email: string) => void;
  onSaveProject: () => void;
  onRequestConsultation: () => void;
  onUpdateQuote?: (updatedQuoteData: any) => void;
  onClose: () => void;
}

const QuoteCompletePage: React.FC<QuoteCompletePageProps> = ({
  quoteData,
  onDownloadPDF,
  onDownloadExcel,
  onDownloadWord,
  onEmailQuote,
  onSaveProject,
  onRequestConsultation,
  onUpdateQuote,
  onClose,
}) => {
  console.log('🎯 QuoteCompletePage rendered with data:', {
    storageSizeMW: quoteData.storageSizeMW,
    durationHours: quoteData.durationHours,
    totalProjectCost: quoteData.totalProjectCost,
    annualSavings: quoteData.annualSavings,
    paybackYears: quoteData.paybackYears
  });
  
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showInstallerModal, setShowInstallerModal] = useState(false);
  const [showIncentivesModal, setShowIncentivesModal] = useState(false);
  const [showLeadCaptureModal, setShowLeadCaptureModal] = useState(false);
  const [pendingDownloadFormat, setPendingDownloadFormat] = useState<'PDF' | 'Excel' | 'Word' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showSaveReminder, setShowSaveReminder] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      setIsLoadingAuth(false);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // 🔥 RECALCULATED VALUES FROM DATABASE - Single source of truth
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalCost: quoteData.totalProjectCost,
    annualSavings: quoteData.annualSavings,
    paybackYears: quoteData.paybackYears,
    roi: 0,
    loading: true
  });
  
  // Recalculate metrics using centralized service on mount
  useEffect(() => {
    const recalculateMetrics = async () => {
      try {
        console.log('🔄 Recalculating dashboard metrics from database...');
        const result = await calculateFinancialMetrics({
          storageSizeMW: quoteData.storageSizeMW,
          durationHours: quoteData.durationHours,
          solarMW: quoteData.solarMW,
          windMW: quoteData.windMW,
          location: quoteData.location,
          electricityRate: quoteData.electricityRate || 0.12
        });
        
        console.log('💰 Dashboard recalculated from database (data source:', result.dataSource + ')');
        console.log('📊 Results:', {
          netCost: result.netCost,
          annualSavings: result.annualSavings,
          paybackYears: result.paybackYears,
          roi10Year: result.roi10Year
        });
        
        setDashboardMetrics({
          totalCost: result.netCost,
          annualSavings: result.annualSavings,
          paybackYears: result.paybackYears,
          roi: result.roi10Year,
          loading: false
        });
      } catch (error) {
        console.error('❌ Error recalculating dashboard metrics:', error);
        // Keep initial values on error
        setDashboardMetrics(prev => ({ ...prev, loading: false }));
      }
    };
    
    recalculateMetrics();
  }, [quoteData.storageSizeMW, quoteData.durationHours, quoteData.solarMW, quoteData.windMW, quoteData.location, quoteData.electricityRate]);
  
  // Persistent AI state management
  const [aiState, setAiState] = useState<AIState>(aiStateService.getAIState().state);
  const [appliedConfig, setAppliedConfig] = useState<string>(aiStateService.getAIState().appliedConfig || '');
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false); // Add immediate button feedback
  
  // Legacy compatibility - derived from persistent state
  const aiConfigApplied = aiState === 'applied';
  
  const [aiSuggestion, setAiSuggestion] = useState<{
    storageSizeMW: number;
    durationHours: number;
    solarMW?: number;
    windMW?: number;
    reasoning: string;
    costImpact: string;
    roiChange: string;
    warning?: string;
  } | null>(null);

  // Initialize AI state from persistent storage
  useEffect(() => {
    const persistentState = aiStateService.getAIState();
    setAiState(persistentState.state);
    if (persistentState.appliedConfig) {
      setAppliedConfig(persistentState.appliedConfig);
    }
  }, []);
  
  // Auto-generate AI baseline when modal opens
  useEffect(() => {
    if (showAIConfig && !aiSuggestion && !isGenerating) {
      // Update state to analyzing
      updateAIState('analyzing');
      setIsGenerating(true);
      setTimeout(() => {
        handleAIGenerate();
      }, 500);
    }
  }, [showAIConfig]);

  // Helper function to update AI state persistently
  const updateAIState = (newState: AIState, additionalData?: any) => {
    setAiState(newState);
    aiStateService.setAIState(newState, additionalData);
  };

  // Remove the problematic continuous AI monitoring that causes infinite loops
  
  // Helper function to get industry name
  const getIndustryName = (template: string | string[]) => {
    const templateKey = Array.isArray(template) ? template[0] : template;
    const industryMap: { [key: string]: string } = {
      'manufacturing': 'Manufacturing Facility',
      'data-center': 'Data Center',
      'cold-storage': 'Cold Storage Warehouse',
      'hospital': 'Hospital',
      'university': 'University/College Campus',
      'retail': 'Retail Store',
      'microgrid': 'Microgrid',
      'agricultural': 'Agricultural Operation',
      'car-wash': 'Car Wash',
      'ev-charging': 'EV Charging Hub',
      'apartment': 'Apartment Building',
      'indoor-farm': 'Indoor Farm',
      'warehouse': 'Warehouse/Distribution'
    };
    const result = industryMap[templateKey] || templateKey;
    
    // If multiple templates, show count
    if (Array.isArray(template) && template.length > 1) {
      return `${result} (+${template.length - 1} more)`;
    }
    return result;
  };
  
  // AI Baseline Model - use the ACTUAL configured values, don't recalculate
  // The storageSizeMW was already correctly calculated based on user inputs
  const calculateOptimalBaseline = async () => {
    const industry = Array.isArray(quoteData.industryTemplate) ? quoteData.industryTemplate[0] : quoteData.industryTemplate;
    
    // DON'T recalculate baseline - use what user configured
    // Their configuration was calculated correctly from their inputs (e.g., 150 rooms)
    // Recalculating with scale=1.0 uses wrong assumptions (e.g., 100 rooms default)
    
    console.log('🤖 [AI Analysis] Using user\'s configured values (already calculated correctly):', {
      storageSizeMW: quoteData.storageSizeMW,
      durationHours: quoteData.durationHours,
      solarMW: quoteData.solarMW
    });
    
    return {
      optimalPowerMW: quoteData.storageSizeMW, // Use their correctly calculated battery size
      optimalDurationHrs: quoteData.durationHours,
      optimalSolarMW: quoteData.solarMW || 0,
      costPerMWh: 350000, // Base cost per MWh
      annualSavingsRate: 0.15, // 15% of system cost annually
    };
  };

  // 🔥 USE CENTRALIZED CALCULATION SERVICE - Single source of truth from database
  const calculateROI = async (powerMW: number, durationHrs: number, solarMW: number = 0) => {
    const result = await calculateFinancialMetrics({
      storageSizeMW: powerMW,
      durationHours: durationHrs,
      solarMW: solarMW,
      windMW: 0,
      location: quoteData.location || 'California',
      electricityRate: quoteData.electricityRate || 0.12
    });
    
    console.log('💰 Dashboard ROI calculation from centralized service (data source:', result.dataSource + ')');
    
    return { 
      totalCost: result.netCost, 
      annualSavings: result.annualSavings, 
      payback: result.paybackYears, 
      energyMWh: powerMW * durationHrs 
    };
  };

  const handleEmailSubmit = () => {
    if (email && email.includes('@')) {
      onEmailQuote(email);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };

  const handleSave = () => {
    if (!currentUser) {
      // Show lead capture modal if not logged in
      setShowLeadCaptureModal(true);
      setPendingDownloadFormat(null); // Clear download format to indicate this is for save
      return;
    }
    onSaveProject();
    setProjectSaved(true);
    setShowSaveReminder(false);
    setTimeout(() => setProjectSaved(false), 3000);
  };

  // Download handlers with lead capture
  const handleDownloadClick = (format: 'PDF' | 'Excel' | 'Word') => {
    setPendingDownloadFormat(format);
    
    // If user is already logged in, skip lead capture
    if (currentUser) {
      proceedWithDownload(format);
      return;
    }
    
    // Otherwise show lead capture modal
    setShowLeadCaptureModal(true);
  };

  const handleLeadCaptureComplete = (userData: { name: string; email: string }) => {
    // User provided info, proceed with download or save
    setShowLeadCaptureModal(false);
    if (pendingDownloadFormat) {
      proceedWithDownload(pendingDownloadFormat);
    } else {
      // This was for save, now save the project
      onSaveProject();
      setProjectSaved(true);
      setShowSaveReminder(false);
      setTimeout(() => setProjectSaved(false), 3000);
    }
  };

  const handleLeadCaptureSkip = () => {
    // User skipped/closed modal - do NOT download, clear pending action
    setShowLeadCaptureModal(false);
    setPendingDownloadFormat(null);
    // Do not call proceedWithDownload - user must complete form to get download
  };

  const proceedWithDownload = (format?: 'PDF' | 'Excel' | 'Word') => {
    const downloadFormat = format || pendingDownloadFormat;
    if (downloadFormat === 'PDF') {
      onDownloadPDF();
    } else if (downloadFormat === 'Excel') {
      onDownloadExcel();
    } else if (downloadFormat === 'Word') {
      onDownloadWord();
    }
    setPendingDownloadFormat(null);
  };

  const handleAIGenerate = async () => {
    // Allow empty prompts for continuous monitoring with default analysis
    const defaultPrompt = 'analyze current configuration';
    const promptToUse = defaultPrompt; // Always use default for auto-analysis
    
    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(async () => {
      const prompt = promptToUse.toLowerCase();
      const baseline = await calculateOptimalBaseline();
      const currentROI = await calculateROI(quoteData.storageSizeMW, quoteData.durationHours, quoteData.solarMW);
      const optimalROI = await calculateROI(baseline.optimalPowerMW, baseline.optimalDurationHrs, baseline.optimalSolarMW);
      
      let newSize = quoteData.storageSizeMW;
      let newDuration = quoteData.durationHours;
      let newSolar = quoteData.solarMW;
      let reasoning = '';
      let warning = '';
      
      // Analyze current configuration vs optimal
      const isOversized = quoteData.storageSizeMW > baseline.optimalPowerMW * 1.4; // More tolerant threshold
      const isUndersized = quoteData.storageSizeMW < baseline.optimalPowerMW * 0.6; // More tolerant threshold
      const isOverduration = quoteData.durationHours > baseline.optimalDurationHrs * 1.5;
      const isUnderduration = quoteData.durationHours < baseline.optimalDurationHrs * 0.5;
      
      // Smart response to user request
      if (prompt.includes('optim') || prompt.includes('best') || prompt.includes('ideal')) {
        // Return to optimal baseline
        newSize = baseline.optimalPowerMW;
        newDuration = baseline.optimalDurationHrs;
        newSolar = baseline.optimalSolarMW;
        reasoning = `Based on your ${getIndustryName(quoteData.industryTemplate)} industry profile, the optimal configuration is ${newSize.toFixed(1)}MW / ${newDuration}hr with ${newSolar.toFixed(1)}MW solar. This maximizes ROI while meeting your operational needs.`;
      } else if (prompt.includes('reduce') || prompt.includes('cheaper') || prompt.includes('smaller') || prompt.includes('cut cost')) {
        newSize = Math.max(0.5, baseline.optimalPowerMW * 0.75);
        newDuration = Math.max(2, baseline.optimalDurationHrs * 0.85);
        const newROI = await calculateROI(newSize, newDuration, newSolar);
        reasoning = `I've reduced the system to ${newSize.toFixed(1)}MW / ${newDuration}hr, cutting upfront costs by ~${Math.round((1 - newROI.totalCost / currentROI.totalCost) * 100)}%. This maintains ${Math.round((newSize / baseline.optimalPowerMW) * 100)}% of optimal capacity.`;
        if (newSize < baseline.optimalPowerMW * 0.7) {
          warning = '⚠️ Warning: This configuration may not fully meet your peak demand needs. Consider backup power sources or load shedding.';
        }
      } else if (prompt.includes('increase') || prompt.includes('more') || prompt.includes('bigger') || prompt.includes('larger')) {
        // User wants MORE power
        newSize = quoteData.storageSizeMW * 1.3;
        newDuration = quoteData.durationHours;
        const newROI = await calculateROI(newSize, newDuration, newSolar);
        
        if (newSize > baseline.optimalPowerMW * 1.4) {
          warning = `⚠️ Caution: ${newSize.toFixed(1)}MW exceeds your optimal needs by ${Math.round(((newSize / baseline.optimalPowerMW) - 1) * 100)}%. This adds $${((newROI.totalCost - optimalROI.totalCost) / 1000000).toFixed(1)}M in costs with diminishing returns. Payback extends to ${newROI.payback.toFixed(1)} years.`;
          reasoning = `I can increase to ${newSize.toFixed(1)}MW, but this is ${Math.round(((newSize / baseline.optimalPowerMW) - 1) * 100)}% above your optimal size. Unless you have specific high-power demands or future expansion plans, this may not be economically justified.`;
        } else {
          reasoning = `Increased to ${newSize.toFixed(1)}MW / ${newDuration}hr for enhanced capacity. This provides ${Math.round(((newSize - quoteData.storageSizeMW) / quoteData.storageSizeMW) * 100)}% more power for peak shaving and grid services.`;
        }
      } else if (prompt.includes('backup') || prompt.includes('outage') || prompt.includes('resilience') || prompt.includes('emergency')) {
        newDuration = Math.max(baseline.optimalDurationHrs * 1.5, 6);
        reasoning = `For backup power and resilience, I recommend ${newSize.toFixed(1)}MW / ${newDuration}hr. This provides ${newDuration} hours of backup power for critical loads during grid outages.`;
      } else if (prompt.includes('solar') || prompt.includes('renewable')) {
        newSolar = baseline.optimalSolarMW;
        reasoning = `Adding ${newSolar.toFixed(1)}MW of solar pairs well with your ${newSize.toFixed(1)}MW / ${newDuration}hr battery. The battery can store excess solar during the day and discharge during peak evening hours when solar production drops.`;
      } else {
        // Generic analysis of current config
        if (isOversized) {
          newSize = baseline.optimalPowerMW;
          newDuration = baseline.optimalDurationHrs;
          const percentOversize = Math.round((quoteData.storageSizeMW / baseline.optimalPowerMW - 1) * 100);
          const costSavings = ((currentROI.totalCost - optimalROI.totalCost) / 1000000).toFixed(1);
          warning = `⚠️ Your current ${quoteData.storageSizeMW.toFixed(1)}MW configuration is ${percentOversize}% larger than the industry baseline. Recommended: ${newSize.toFixed(1)}MW to save $${costSavings}M.`;
          reasoning = `Based on industry benchmarks for ${getIndustryName(quoteData.industryTemplate)}, a ${newSize.toFixed(1)}MW / ${newDuration}hr system would provide optimal economics while meeting your operational needs. The current oversizing adds upfront cost without proportional revenue gains.`;
        } else if (isUndersized) {
          // Instead of jumping to full baseline, recommend a 30-50% increase
          newSize = Math.min(baseline.optimalPowerMW, quoteData.storageSizeMW * 1.4);
          const percentUndersize = Math.round((1 - quoteData.storageSizeMW / baseline.optimalPowerMW) * 100);
          const percentIncrease = Math.round((newSize / quoteData.storageSizeMW - 1) * 100);
          warning = `⚠️ Your current ${quoteData.storageSizeMW.toFixed(1)}MW system is ${percentUndersize}% below the industry baseline. Recommended: ${newSize.toFixed(1)}MW (+${percentIncrease}%) to better capture available opportunities.`;
          reasoning = `Consider increasing to ${newSize.toFixed(1)}MW for ${percentIncrease}% more capacity. This better matches typical ${getIndustryName(quoteData.industryTemplate)} demand profiles and can improve overall returns. The industry baseline is ${baseline.optimalPowerMW.toFixed(1)}MW, but this incremental increase balances cost and benefit.`;
        } else {
          reasoning = `Your current configuration (${quoteData.storageSizeMW.toFixed(1)}MW / ${quoteData.durationHours}hr) is well-sized for your needs and aligns with industry standards. ROI: ${currentROI.payback.toFixed(1)} year payback. Try asking to "optimize", "reduce cost", or "add more backup power".`;
        }
      }
      
      const newROI = await calculateROI(newSize, newDuration, newSolar);
      const costChange = newROI.totalCost - currentROI.totalCost;
      const roiChange = newROI.payback - currentROI.payback;
      
      setAiSuggestion({
        storageSizeMW: newSize,
        durationHours: newDuration,
        solarMW: newSolar > quoteData.solarMW ? newSolar : undefined,
        reasoning,
        costImpact: costChange > 0 
          ? `+$${(costChange / 1000000).toFixed(2)}M (${Math.round((costChange / currentROI.totalCost) * 100)}% increase)`
          : costChange < 0
          ? `-$${(Math.abs(costChange) / 1000000).toFixed(2)}M (${Math.round((Math.abs(costChange) / currentROI.totalCost) * 100)}% savings)`
          : 'No cost change',
        roiChange: roiChange > 0
          ? `Payback increases by ${roiChange.toFixed(1)} years`
          : roiChange < 0
          ? `Payback improves by ${Math.abs(roiChange).toFixed(1)} years`
          : 'ROI unchanged',
        warning
      });
      setIsGenerating(false);
      updateAIState('active'); // AI analysis is ready
      setShowScrollIndicator(true); // Reset scroll indicator for new suggestions
    }, 1500);
  };

  const handleApplyAI = async () => {
    if (!aiSuggestion) return;
    
    setIsApplyingAI(true);
    
    // Calculate ROI difference for user feedback
    const currentROI = await calculateROI(quoteData.storageSizeMW, quoteData.durationHours, quoteData.solarMW);
    const newROI = await calculateROI(aiSuggestion.storageSizeMW, aiSuggestion.durationHours, aiSuggestion.solarMW || quoteData.solarMW);
    
    // Show success feedback with the recommendation details
    const roiImprovement = newROI.payback < currentROI.payback ? 
      `Payback improved by ${(currentROI.payback - newROI.payback).toFixed(1)} years!` :
      `New payback: ${newROI.payback.toFixed(1)} years`;
    
    const costImpact = newROI.totalCost < currentROI.totalCost ?
      `Cost reduced by $${((currentROI.totalCost - newROI.totalCost) / 1000000).toFixed(1)}M` :
      `Investment: $${(newROI.totalCost / 1000000).toFixed(1)}M`;
    
    // Set applied state and configuration details
    setTimeout(() => {
      const appliedConfigString = `${aiSuggestion.storageSizeMW.toFixed(1)}MW / ${aiSuggestion.durationHours}hr`;
      setAppliedConfig(appliedConfigString);
      setIsApplyingAI(false);
      
      // Update persistent AI state
      updateAIState('applied', { 
        appliedConfig: appliedConfigString 
      });
      
      // If onUpdateQuote is provided, use it to update the configuration
      if (onUpdateQuote) {
        const updatedQuoteData = {
          ...quoteData,
          storageSizeMW: aiSuggestion.storageSizeMW,
          durationHours: aiSuggestion.durationHours,
          solarMW: aiSuggestion.solarMW || quoteData.solarMW,
          windMW: aiSuggestion.windMW || quoteData.windMW,
          totalProjectCost: newROI.totalCost,
          annualSavings: newROI.annualSavings,
          paybackYears: newROI.payback
        };
        onUpdateQuote(updatedQuoteData);
      }
      
      // Close the modal after a brief delay to show success
      setTimeout(() => {
        setShowAIConfig(false);
        setAiSuggestion(null);
      }, 1500);
    }, 800); // Short delay to show processing
  };

  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 overflow-y-auto">
      {/* Save Reminder Banner - IMPROVED VISIBILITY */}
      {showSaveReminder && !projectSaved && (
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-2xl border-b-4 border-yellow-700">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-white/30 p-3 rounded-xl backdrop-blur-sm animate-pulse shadow-lg">
                  <AlertCircle className="w-8 h-8 drop-shadow-md" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold mb-1.5 drop-shadow-md">⚠️ Don't Lose Your Quote!</h3>
                  <p className="text-white font-semibold text-base drop-shadow-sm">
                    {currentUser 
                      ? "Save your quote now to access it anytime and track your energy projects."
                      : "Create a free account to save your quote and access it anytime. Takes only 30 seconds!"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="bg-white text-orange-600 px-8 py-4 rounded-xl font-extrabold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center gap-2 hover:scale-105 hover:bg-gray-50 border-2 border-orange-200"
                >
                  <Save className="w-6 h-6" />
                  {currentUser ? 'Save Quote' : 'Sign Up & Save'}
                </button>
                <button
                  onClick={() => setShowSaveReminder(false)}
                  className="text-white hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                {/* Merlin Image centered */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={merlinImage}
                    alt="Merlin the Wizard"
                    className="w-32 h-32 object-contain rounded-lg"
                  />
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">
                  Congratulations!
                </h1>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  Your Quote is Ready
                </div>
                <p className="text-lg text-gray-600">
                  Here's your customized <span className="font-semibold text-blue-600">{getIndustryName(quoteData.industryTemplate)}</span> energy storage solution
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-4xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Celebration Banner */}
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-2xl p-6 mb-8 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="text-5xl">💰</span>
            <h2 className="text-3xl font-bold">Excellent Choice!</h2>
            <span className="text-5xl">💰</span>
          </div>
          <p className="text-xl opacity-95">
            You've designed an energy storage system that will transform your energy costs and sustainability goals.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>Save Money</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌱</span>
              <span>Go Green</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Energy Independence</span>
            </div>
          </div>
        </div>
        
        {/* Use Case & Goal Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm opacity-90">Industry</div>
                <div className="text-xl font-bold">{getIndustryName(quoteData.industryTemplate)}</div>
              </div>
              <div className="text-3xl">→</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm opacity-90">Location</div>
                <div className="text-xl font-bold">{quoteData.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Summary Card - Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-12 shadow-2xl mb-12">
          <h2 className="text-4xl font-bold mb-8 text-center">Your Energy Storage System</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* System Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <h3 className="font-bold text-2xl mb-4 border-b border-white/30 pb-3">System Configuration</h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>Power Output:</span>
                  </span>
                  <span className="font-bold text-2xl">
                    {(quoteData.storageSizeMW + (quoteData.solarMW || 0) + (quoteData.windMW || 0) + (quoteData.generatorMW || 0)).toFixed(1)} MW
                    {((quoteData.solarMW || 0) + (quoteData.windMW || 0) + (quoteData.generatorMW || 0) > 0) && (
                      <span className="text-sm text-white ml-2">
                        ({quoteData.storageSizeMW.toFixed(1)}MW battery
                        {(quoteData.solarMW || 0) > 0 && ` + ${quoteData.solarMW.toFixed(1)}MW solar`}
                        {(quoteData.windMW || 0) > 0 && ` + ${quoteData.windMW.toFixed(1)}MW wind`}
                        {(quoteData.generatorMW || 0) > 0 && ` + ${quoteData.generatorMW.toFixed(1)}MW generator`})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>🔋</span>
                    <span>Energy Storage:</span>
                  </span>
                  <span className="font-bold text-2xl">{totalEnergyMWh.toFixed(1)} MWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Duration:</span>
                  </span>
                  <span className="font-bold text-2xl">{quoteData.durationHours} hours</span>
                </div>
                {hasRenewables && (
                  <div className="pt-3 border-t border-white/30 mt-4">
                    <div className="text-lg font-semibold mb-2">+ Renewable Energy:</div>
                    {quoteData.solarMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>☀️</span>
                        <span>{quoteData.solarMW.toFixed(1)} MW Solar</span>
                      </div>
                    )}
                    {quoteData.windMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>💨</span>
                        <span>{quoteData.windMW.toFixed(1)} MW Wind</span>
                      </div>
                    )}
                    {quoteData.generatorMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>{quoteData.generatorMW.toFixed(1)} MW Generator</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <h3 className="font-bold text-2xl mb-4 border-b border-white/30 pb-3">
                Financial Summary
                {dashboardMetrics.loading && <span className="text-sm ml-2 animate-pulse">Calculating...</span>}
              </h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between items-center">
                  <span>Total Project Cost:</span>
                  <span className="font-bold text-2xl">${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center text-green-300">
                  <span>Federal Tax Credit (30%):</span>
                  <span className="font-bold text-2xl">-${(quoteData.taxCredit / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/30">
                  <span className="font-bold">Net Cost:</span>
                  <span className="font-bold text-3xl">${(dashboardMetrics.totalCost / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center text-green-300 mt-4">
                  <span>Annual Savings:</span>
                  <span className="font-bold text-2xl">${(dashboardMetrics.annualSavings / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between items-center bg-yellow-400/20 rounded-xl p-3 mt-4">
                  <span className="font-bold text-yellow-200">Payback Period:</span>
                  <span className="font-bold text-3xl text-yellow-100">{dashboardMetrics.paybackYears.toFixed(1)} years</span>
                </div>
                <div className="flex justify-between items-center bg-green-500/20 rounded-xl p-3 mt-2">
                  <span className="font-bold text-green-200">10-Year ROI:</span>
                  <span className="font-bold text-3xl text-green-100">{dashboardMetrics.roi.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selections Summary */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🏗️</div>
              <div className="text-sm opacity-80">Installation</div>
              <div className="font-bold text-xl capitalize">{quoteData.installationOption.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🚢</div>
              <div className="text-sm opacity-80">Shipping</div>
              <div className="font-bold text-xl capitalize">{quoteData.shippingOption.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm opacity-80">Financing</div>
              <div className="font-bold text-xl capitalize">{quoteData.financingOption}</div>
            </div>
          </div>
        </div>

        {/* AI Configuration Validation - Middle of page */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-2xl p-12 mb-12 text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-4xl font-bold mb-4">✓ Validate Your Configuration</h3>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              {aiStateService.getContextualMessage()} Analyze your configuration for <strong className="text-yellow-300">{getIndustryName(quoteData.industryTemplate)}</strong> optimization.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-lg">
              <span>Your Configuration:</span>
              <span className="font-bold text-2xl">{quoteData.storageSizeMW.toFixed(1)}MW / {quoteData.durationHours}hr</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Immediate visual feedback
                setIsButtonLoading(true);
                
                // Only update state to analyzing when opening modal
                if (!showAIConfig) {
                  updateAIState('analyzing');
                }
                setShowAIConfig(true);
                
                // Reset loading state after a brief moment
                setTimeout(() => setIsButtonLoading(false), 1000);
              }}
              className={`${
                isButtonLoading 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ring-4 ring-blue-300' 
                  : aiStateService.getButtonStyling(aiState).className
              } px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all hover:scale-105 flex items-center gap-3`}
              disabled={isGenerating || isButtonLoading}
            >
              <Sparkles className={`w-6 h-6 ${isGenerating || isButtonLoading ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="text-xl">
                  {isButtonLoading ? 'Opening AI Analysis...' : 
                   isGenerating ? 'AI Analyzing...' : 
                   aiStateService.getButtonStyling(aiState).text}
                </div>
                <div className="text-xs opacity-90">
                  {isButtonLoading ? 'Preparing recommendations' : aiStateService.getButtonStyling(aiState).description}
                </div>
              </div>
            </button>
            
            {/* AI Configuration Applied Feedback */}
            {aiConfigApplied && (
              <div className="mt-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl p-4 animate-fadeIn">
                <div className="text-center">
                  <div className="text-green-800 font-bold text-lg mb-2">✅ AI Optimization Applied!</div>
                  <div className="text-green-700 text-sm">
                    New configuration: <span className="font-bold">{appliedConfig}</span>
                  </div>
                  <div className="text-green-600 text-xs mt-1">
                    {aiStateService.getContextualMessage()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download & Share Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-gray-900">
              Download & Share Your Quote
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Download Options */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-4 text-lg">Download Format:</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleDownloadClick('PDF')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📄</span>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadClick('Excel')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📊</span>
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={() => handleDownloadClick('Word')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📝</span>
                  <span>Download Word</span>
                </button>
              </div>
            </div>

            {/* Email & Save */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-4 text-lg">Email or Save:</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email || !email.includes('@')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      emailSent
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {emailSent ? '✓ Sent' : '📧 Send'}
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                    projectSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-900 text-white'
                  }`}
                >
                  {projectSaved ? '✓ Saved to Projects' : '💾 Save to My Projects'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recommended Next Steps
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">👨‍💼</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Free Consultation</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Speak with an energy expert to refine your solution
              </p>
              <button
                onClick={() => setShowConsultationModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Schedule Call
              </button>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">🏗️</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Get Installer Quotes</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Connect with certified installers in your area
              </p>
              <button
                onClick={() => setShowInstallerModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Find Installers
              </button>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">💳</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Explore Financing</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Compare loan, lease, and PPA options
              </p>
              <button
                onClick={() => setShowFinancingModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                View Options
              </button>
            </div>

            {/* Step 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">🎁</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Incentives Guide</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Discover federal, state & local rebates
              </p>
              <button
                onClick={() => setShowIncentivesModal(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Find Incentives
              </button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Move Forward?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Our team is here to help you every step of the way
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onRequestConsultation}
              className="bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Talk to an Expert
            </button>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-lg transition-all border-2 border-white/30"
            >
              Back to Wizard
            </button>
          </div>
        </div>
      </div>

      {/* AI Auto-Configuration Modal */}
      {showAIConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">AI Configuration Analysis</h3>
                    <p className="text-sm opacity-90 mt-1">Comparing your configuration vs. optimal baseline</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIConfig(false);
                    setAiSuggestion(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div 
              className="flex-1 overflow-y-auto p-8 relative"
              onScroll={() => setShowScrollIndicator(false)}
            >
              {/* Scroll Indicator - shows when content is scrollable */}
              {aiSuggestion && showScrollIndicator && (
                <div className="sticky top-0 left-0 right-0 flex justify-center pointer-events-none z-10 -mt-4 mb-2">
                  <div className="bg-gradient-to-b from-purple-500 to-transparent text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                    <span>↓</span>
                    <span>Scroll for AI Recommendations</span>
                    <span>↓</span>
                  </div>
                </div>
              )}
              
              {/* Current Configuration */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Current Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Power Output:</span>
                    <span className="font-bold text-gray-900 ml-2">
                      {(quoteData.storageSizeMW + (quoteData.solarMW || 0) + (quoteData.windMW || 0) + (quoteData.generatorMW || 0)).toFixed(1)} MW
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-bold text-gray-900 ml-2">{quoteData.durationHours} hours</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-bold text-gray-900 ml-2">{(quoteData.storageSizeMW * quoteData.durationHours).toFixed(1)} MWh</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payback:</span>
                    <span className="font-bold text-gray-900 ml-2">{dashboardMetrics.paybackYears.toFixed(1)} years</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis - Auto-generated */}
              {!aiSuggestion && !isGenerating && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
                  <p className="text-blue-900 text-center">
                    <span className="text-2xl mr-2">🤖</span>
                    <strong>Analyzing your configuration...</strong>
                  </p>
                  <p className="text-blue-700 text-sm text-center mt-2">
                    AI is comparing your {quoteData.storageSizeMW.toFixed(1)}MW / {quoteData.durationHours}hr system against the optimal baseline for {getIndustryName(quoteData.industryTemplate)}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-purple-900 font-bold text-lg">AI is analyzing your configuration...</p>
                  <p className="text-purple-700 text-sm mt-2">Comparing against optimal baseline for your industry and goals</p>
                </div>
              )}

              {/* AI Suggestion Result */}
              {aiSuggestion && !isGenerating && (
                <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 animate-fadeIn">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Recommendation
                  </h4>
                  
                  {/* Warning Banner */}
                  {aiSuggestion.warning && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4">
                      <p className="text-sm font-semibold text-yellow-800">{aiSuggestion.warning}</p>
                    </div>
                  )}
                  
                  {/* Suggested Configuration */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">{Number(aiSuggestion.storageSizeMW).toFixed(1)} MW</div>
                        <div className="text-xs text-gray-600">Power Output</div>
                        <div className="text-xs text-purple-600 font-semibold mt-1">
                          {((aiSuggestion.storageSizeMW - quoteData.storageSizeMW) / quoteData.storageSizeMW * 100).toFixed(0) !== '0' 
                            ? `${((aiSuggestion.storageSizeMW - quoteData.storageSizeMW) / quoteData.storageSizeMW * 100 > 0 ? '+' : '')}${((aiSuggestion.storageSizeMW - quoteData.storageSizeMW) / quoteData.storageSizeMW * 100).toFixed(0)}%`
                            : 'No change'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{Number(aiSuggestion.durationHours).toFixed(1)} hrs</div>
                        <div className="text-xs text-gray-600">Duration</div>
                        <div className="text-xs text-blue-600 font-semibold mt-1">
                          {(Number(aiSuggestion.durationHours) - quoteData.durationHours).toFixed(1) !== '0.0'
                            ? `${Number(aiSuggestion.durationHours) - quoteData.durationHours > 0 ? '+' : ''}${(Number(aiSuggestion.durationHours) - quoteData.durationHours).toFixed(1)} hrs`
                            : 'No change'}
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{(Number(aiSuggestion.storageSizeMW) * Number(aiSuggestion.durationHours)).toFixed(1)} MWh</div>
                      <div className="text-xs text-gray-600">Total Energy Capacity</div>
                    </div>
                    {aiSuggestion.solarMW && (
                      <div className="text-center p-3 bg-yellow-100 rounded-lg mt-4">
                        <div className="text-2xl font-bold text-yellow-700">{Number(aiSuggestion.solarMW).toFixed(1)} MW</div>
                        <div className="text-xs text-gray-600">Recommended Solar</div>
                      </div>
                    )}
                  </div>

                  {/* Financial Impact */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Cost Impact</div>
                        <div className={`text-sm font-bold ${aiSuggestion.costImpact.startsWith('+') ? 'text-red-600' : aiSuggestion.costImpact.startsWith('-') ? 'text-green-600' : 'text-gray-600'}`}>
                          {aiSuggestion.costImpact}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">ROI Impact</div>
                        <div className={`text-sm font-bold ${aiSuggestion.roiChange.includes('increases') ? 'text-red-600' : aiSuggestion.roiChange.includes('improves') ? 'text-green-600' : 'text-gray-600'}`}>
                          {aiSuggestion.roiChange}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">💡 AI Analysis:</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{aiSuggestion.reasoning}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApplyAI}
                      disabled={isApplyingAI}
                      className={`flex-1 ${
                        isApplyingAI 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      } text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
                    >
                      {isApplyingAI ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Applying Configuration...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Apply This Configuration</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAiSuggestion(null);
                        setIsGenerating(true);
                        setTimeout(() => {
                          handleAIGenerate();
                        }, 500);
                      }}
                      className="px-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>New Analysis</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
      />

      {/* Financing Options Modal */}
      <FinancingOptionsModal
        isOpen={showFinancingModal}
        onClose={() => setShowFinancingModal(false)}
        projectData={{
          quoteName: `${getIndustryName(quoteData.industryTemplate)} BESS Project`,
          totalCapEx: dashboardMetrics.totalCost,
          annualSavings: dashboardMetrics.annualSavings,
          powerMW: quoteData.storageSizeMW,
          durationHours: quoteData.durationHours
        }}
      />

      {/* Installer Directory Modal */}
      <InstallerDirectoryModal
        isOpen={showInstallerModal}
        onClose={() => setShowInstallerModal(false)}
        location={quoteData.location}
      />

      {/* Incentives Guide Modal */}
      <IncentivesGuideModal
        isOpen={showIncentivesModal}
        onClose={() => setShowIncentivesModal(false)}
        location={quoteData.location}
        projectSize={quoteData.storageSizeMW}
      />

      {/* Lead Capture Modal */}
      {showLeadCaptureModal && (
        <LeadCaptureModal
          format={pendingDownloadFormat}
          purpose={pendingDownloadFormat ? 'download' : 'save'}
          onComplete={handleLeadCaptureComplete}
          onSkip={handleLeadCaptureSkip}
        />
      )}
    </div>
  );
};

export default QuoteCompletePage;
