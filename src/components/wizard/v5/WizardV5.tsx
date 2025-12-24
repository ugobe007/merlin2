/**
 * MERLIN WIZARD V5 - Main Orchestrator
 * =====================================
 * Clean implementation - December 21, 2025
 * 
 * Architecture:
 * - Single file orchestrator (~300 lines max)
 * - Step components handle their own UI
 * - Design system provides all styling tokens
 * - MerlinInputs provides all input components
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Home } from 'lucide-react';

// Design System
import { COLORS, WIZARD_STEPS } from './design-system';

// Step Components
import { Step1LocationGoals } from './steps/Step1LocationGoals';
import { Step2IndustrySelect } from './steps/Step2IndustrySelect';
import { Step3FacilityDetails } from './steps/Step3FacilityDetails';
import { Step4MagicFit } from './steps/Step4MagicFit';
import { Step5QuoteReview } from './steps/Step5QuoteReview';

// Modals
import { SolarOpportunityModal } from './components/SolarOpportunityModal';
import { SolarConfigModal, type SolarConfig } from './components/SolarConfigModal';
import { EVChargingConfigModal, type EVChargingConfig } from './components/EVChargingConfigModal';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WizardState {
  // Step 1 - Location & Goals
  state: string;
  zipCode: string;
  goals: string[];
  
  // Step 2 - Industry
  selectedIndustry: string;
  industryName: string;
  
  // Step 3 - Facility Details
  facilitySubtype: string;
  useCaseData: Record<string, any>;
  
  // Step 4 - Magic Fit (System sizing)
  batteryKW: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;
  gridConnection: 'on-grid' | 'off-grid' | 'limited';
  
  // Step 5 - Quote
  quoteResult: any | null;
  
  // UI State
  electricityRate: number;
}

const DEFAULT_STATE: WizardState = {
  state: '',
  zipCode: '',
  goals: [],
  selectedIndustry: '',
  industryName: '',
  facilitySubtype: '',
  useCaseData: {},
  batteryKW: 500,
  durationHours: 4,
  solarKW: 0,
  generatorKW: 0,
  gridConnection: 'on-grid',
  quoteResult: null,
  electricityRate: 0.12,
};

// ═══════════════════════════════════════════════════════════════════════════════
// WIZARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface WizardV5Props {
  initialUseCase?: string;
  onComplete?: (quote: any) => void;
  onCancel?: () => void;
  // Legacy compatibility props
  onClose?: () => void;
  onFinish?: (quote?: any) => void;
  onOpenAdvanced?: () => void;
}

export const WizardV5: React.FC<WizardV5Props> = ({
  initialUseCase,
  onComplete,
  onCancel,
  onClose,
  onFinish,
  onOpenAdvanced,
}) => {
  // Normalize handlers for legacy compatibility
  const handleClose = onClose || onCancel || (() => {});
  const handleComplete = onComplete || onFinish || (() => {});

  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState<WizardState>(DEFAULT_STATE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSolarModal, setShowSolarModal] = useState(false);
  const [showSolarConfigModal, setShowSolarConfigModal] = useState(false);
  const [showEVModal, setShowEVModal] = useState(false);

  // Memoize useCaseData at top-level to comply with Rules of Hooks
  // useCaseData passed directly (useMemo removed - hooks cant be conditional)

  // Solar & EV Configuration state
  const [solarConfig, setSolarConfig] = useState<SolarConfig | null>(null);
  const [evConfig, setEVConfig] = useState<EVChargingConfig | null>(null);

  // Initialize with industry if provided (from props or URL)
  useEffect(() => {
    // Check URL params for industry
    const urlParams = new URLSearchParams(window.location.search);
    const urlIndustry = urlParams.get('industry');
    const effectiveInitialUseCase = initialUseCase || urlIndustry;

    if (effectiveInitialUseCase) {
      setWizardState(prev => ({
        ...prev,
        selectedIndustry: effectiveInitialUseCase,
      }));
      // Skip to step 2 (Step 3: Facility Details) if industry pre-selected
      setCurrentStep(2);
    }
  }, [initialUseCase]);

  // Step Navigation
  const goToStep = useCallback((step: number) => {
    if (step < 0 || step > 4) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const nextStep = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep]);
  const prevStep = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep]);

  // Update state helper
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Calculate solar opportunity based on state location
  const getSolarOpportunity = (state: string): boolean => {
    // States with excellent solar potential (5+ sun hours/day average)
    const highSolarStates = [
      'California', 'Arizona', 'Nevada', 'New Mexico', 'Texas', 'Utah', 'Colorado',
      'Florida', 'Hawaii', 'Georgia', 'North Carolina', 'South Carolina',
      'Oklahoma', 'Louisiana', 'Arkansas', 'Alabama', 'Mississippi', 'Tennessee'
    ];
    return highSolarStates.includes(state);
  };

  // Get solar data for a state
  const getSolarData = (stateName: string) => {
    const solarDataByState: Record<string, { peakSunHours: number; rating: string }> = {
      'Nevada': { peakSunHours: 5.8, rating: 'Excellent' },
      'Arizona': { peakSunHours: 6.2, rating: 'Excellent' },
      'California': { peakSunHours: 5.5, rating: 'Excellent' },
      'Texas': { peakSunHours: 5.3, rating: 'Very Good' },
      'Florida': { peakSunHours: 5.0, rating: 'Very Good' },
      'Colorado': { peakSunHours: 5.4, rating: 'Excellent' },
      'New Mexico': { peakSunHours: 6.0, rating: 'Excellent' },
      'Utah': { peakSunHours: 5.6, rating: 'Excellent' },
      'Hawaii': { peakSunHours: 5.7, rating: 'Excellent' },
      'Georgia': { peakSunHours: 4.8, rating: 'Very Good' },
      'North Carolina': { peakSunHours: 4.9, rating: 'Very Good' },
      'South Carolina': { peakSunHours: 4.9, rating: 'Very Good' },
      'Oklahoma': { peakSunHours: 5.1, rating: 'Very Good' },
      'Louisiana': { peakSunHours: 4.7, rating: 'Good' },
      'Arkansas': { peakSunHours: 4.6, rating: 'Good' },
      'Alabama': { peakSunHours: 4.8, rating: 'Very Good' },
      'Mississippi': { peakSunHours: 4.7, rating: 'Good' },
      'Tennessee': { peakSunHours: 4.5, rating: 'Good' },
    };
    return solarDataByState[stateName] || { peakSunHours: 4.2, rating: 'Good' };
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        const solarData = getSolarData(wizardState.state);
        return (
          <Step1LocationGoals
            state={wizardState.state}
            zipCode={wizardState.zipCode}
            goals={wizardState.goals}
            electricityRate={wizardState.electricityRate}
            peakSunHours={solarData.peakSunHours}
            solarRating={solarData.rating}
            onStateChange={(v) => updateState({ state: v })}
            onZipCodeChange={(v) => updateState({ zipCode: v })}
            onGoalsChange={(v) => updateState({ goals: v })}
            onElectricityRateChange={(rate) => updateState({ electricityRate: rate })}
            onContinue={() => setCurrentStep(1)}
            onOpenAdvanced={onOpenAdvanced}
          />
        );
      
      case 1:
        const solarDataStep2 = getSolarData(wizardState.state);
        return (
          <Step2IndustrySelect
            selectedIndustry={wizardState.selectedIndustry}
            onIndustrySelect={(slug, name) => updateState({ selectedIndustry: slug, industryName: name })}
            solarOpportunity={getSolarOpportunity(wizardState.state)}
            onSolarClick={() => setShowSolarModal(true)}
            state={wizardState.state}
            electricityRate={wizardState.electricityRate}
            peakSunHours={solarDataStep2.peakSunHours}
            solarRating={solarDataStep2.rating}
          />
        );
      
      case 2:
        return (
          <Step3FacilityDetails
            selectedIndustry={wizardState.selectedIndustry}
            industryName={wizardState.industryName}
            useCaseData={wizardState.useCaseData}
            onDataChange={(field, value) => updateState({ 
              useCaseData: { ...wizardState.useCaseData, [field]: value } 
            })}
            onSolarConfigClick={() => setShowSolarConfigModal(true)}
            onEVConfigClick={() => setShowEVModal(true)}
            solarKW={solarConfig?.totalSolarKW || wizardState.solarKW}
            evChargerCount={evConfig ? (evConfig.existingL2Count + evConfig.existingDCFCCount + evConfig.desiredL2Count + evConfig.desiredDCFCCount) : 0}
            state={wizardState.state}
            zipCode={wizardState.zipCode}
            goals={wizardState.goals}
            electricityRate={wizardState.electricityRate}
            batteryKW={wizardState.batteryKW}
            durationHours={wizardState.durationHours}
            generatorKW={wizardState.generatorKW}
            gridConnection={wizardState.gridConnection}
          />
        );
      
      case 3:
        // Memoize useCaseData to prevent infinite effect loop in Step4MagicFit
        // useCaseData passed directly (useMemo removed - hooks cant be conditional)
        return (
          <Step4MagicFit
            selectedIndustry={wizardState.selectedIndustry}
            useCaseData={wizardState.useCaseData}
            state={wizardState.state}
            goals={wizardState.goals}
            electricityRate={wizardState.electricityRate}
            batteryKW={wizardState.batteryKW}
            durationHours={wizardState.durationHours}
            solarKW={wizardState.solarKW}
            generatorKW={wizardState.generatorKW}
            gridConnection={wizardState.gridConnection}
            onBatteryChange={(v) => updateState({ batteryKW: v })}
            onDurationChange={(v) => updateState({ durationHours: v })}
            onSolarChange={(v) => updateState({ solarKW: v })}
            onGeneratorChange={(v) => updateState({ generatorKW: v })}
            onGridConnectionChange={(v) => updateState({ gridConnection: v })}
            onContinue={nextStep}
          />
        );
      
      case 4:
        return (
          <Step5QuoteReview
            state={wizardState.state}
            selectedIndustry={wizardState.selectedIndustry}
            industryName={wizardState.industryName}
            goals={wizardState.goals}
            useCaseData={wizardState.useCaseData}
            batteryKW={wizardState.batteryKW}
            durationHours={wizardState.durationHours}
            solarKW={wizardState.solarKW}
            generatorKW={wizardState.generatorKW}
            gridConnection={wizardState.gridConnection}
            electricityRate={wizardState.electricityRate}
            quoteResult={wizardState.quoteResult}
            onQuoteGenerated={(quote) => updateState({ quoteResult: quote })}
          />
        );
      
      default:
        return null;
    }
  };

  // Handle applying solar configuration from modal
  const handleApplySolar = useCallback((solarKW: number) => {
    updateState({ solarKW });
    // Add solar to goals if not already present
    if (!wizardState.goals.includes('Solar Optimization')) {
      updateState({ goals: [...wizardState.goals, 'Solar Optimization'] });
    }
  }, [updateState, wizardState.goals]);

  // Handle applying solar config from new modal
  const handleApplySolarConfig = useCallback((config: SolarConfig) => {
    setSolarConfig(config);
    updateState({ 
      solarKW: config.totalSolarKW,
      useCaseData: {
        ...wizardState.useCaseData,
        hasSolar: config.hasSolar,
        existingSolarKW: config.existingSolarKW,
        wantSolar: config.wantSolar,
        desiredSolarKW: config.desiredSolarKW,
      }
    });
    // Add solar to goals if applicable
    if (config.totalSolarKW > 0 && !wizardState.goals.includes('Solar Optimization')) {
      updateState({ goals: [...wizardState.goals, 'Solar Optimization'] });
    }
  }, [updateState, wizardState.useCaseData, wizardState.goals]);

  // Handle applying EV config from modal
  const handleApplyEVConfig = useCallback((config: EVChargingConfig) => {
    setEVConfig(config);
    updateState({ 
      useCaseData: {
        ...wizardState.useCaseData,
        hasEVChargers: config.hasExisting,
        existingEVChargers: config.existingL2Count + config.existingDCFCCount,
        existingL2Count: config.existingL2Count,
        existingDCFCCount: config.existingDCFCCount,
        wantEVChargers: config.wantNew,
        desiredEVChargers: config.desiredL2Count + config.desiredDCFCCount,
        desiredL2Count: config.desiredL2Count,
        desiredDCFCCount: config.desiredDCFCCount,
        evLoadKW: config.totalLoadKW,
      }
    });
    // Add EV to goals if applicable
    if ((config.hasExisting || config.wantNew) && !wizardState.goals.includes('EV Charging')) {
      updateState({ goals: [...wizardState.goals, 'EV Charging'] });
    }
  }, [updateState, wizardState.useCaseData, wizardState.goals]);

  return (
    <div className={`h-screen bg-gradient-to-br ${COLORS.background.page} flex flex-col`}>
      {/* Solar Opportunity Modal (legacy) */}
      <SolarOpportunityModal
        isOpen={showSolarModal}
        onClose={() => setShowSolarModal(false)}
        onApply={handleApplySolar}
        stateName={wizardState.state}
        currentSolarKW={wizardState.solarKW}
        electricityRate={wizardState.electricityRate}
      />

      {/* Solar Config Modal (new compact version) */}
      <SolarConfigModal
        isOpen={showSolarConfigModal}
        onClose={() => setShowSolarConfigModal(false)}
        onApply={handleApplySolarConfig}
        stateName={wizardState.state}
        electricityRate={wizardState.electricityRate}
        batteryKW={wizardState.batteryKW}
        currentConfig={solarConfig || undefined}
      />

      {/* EV Charging Config Modal */}
      <EVChargingConfigModal
        isOpen={showEVModal}
        onClose={() => setShowEVModal(false)}
        onApply={handleApplyEVConfig}
        stateName={wizardState.state}
        electricityRate={wizardState.electricityRate}
        currentConfig={evConfig || undefined}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Step Indicator
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Logo & Back */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Merlin</span>
            </button>
            <div className="text-white/60 text-sm">
              Step {currentStep + 1} of 5
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${COLORS.purple.gradient} transition-all duration-500`}
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
            />
          </div>
          {/* Step Labels */}
          <div className="flex justify-between mt-2">
            {['Location', 'Industry', 'Details', 'System', 'Quote'].map((label, idx) => (
              <button
                key={label}
                onClick={() => idx <= currentStep && goToStep(idx)}
                className={`text-xs font-medium transition-colors ${
                  idx === currentStep 
                    ? 'text-white' 
                    : idx < currentStep 
                      ? 'text-white/60 hover:text-white/80 cursor-pointer' 
                      : 'text-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>


      {/* Wizard Content - Full width scrollable area */}
      <div 
        className="overflow-y-auto overflow-x-hidden w-full scrollbar-hide"
        style={{ 
          height: 'calc(100vh - 200px)',
        }}
      >
        <div className="max-w-4xl mx-auto" style={{ padding: '1.5rem 1rem 10rem 1rem' }}>
          {renderStep()}
        </div>
      </div>

      {currentStep > 0 && (
        <button
          onClick={prevStep}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all
            bg-white/10 backdrop-blur-xl border border-white/20 text-white/90
            hover:bg-white/20 hover:border-white/30 hover:scale-105
            shadow-lg shadow-purple-500/20"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      )}
      {/* Next/Complete Button - Fixed bottom right - More prominent on Step 4 */}
      {/* Disable on Step 1 if no industry selected */}
      {(() => {
        const canGoForward = currentStep !== 1 || wizardState.selectedIndustry.length > 0;
        return (
          <button
            onClick={currentStep === 4 ? () => handleComplete(wizardState.quoteResult) : nextStep}
            disabled={!canGoForward}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all
              backdrop-blur-xl border
              shadow-xl hover:shadow-2xl hover:scale-105 ${
                !canGoForward
                  ? 'bg-gray-500/50 text-gray-300 border-gray-400/30 cursor-not-allowed opacity-50'
                  : currentStep === 3
                    ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 text-white border-emerald-400/50 shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:from-emerald-500 hover:via-green-400 hover:to-teal-400 text-lg px-8 py-4'
                    : 'bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 text-white border-purple-400/30 shadow-purple-500/40 hover:shadow-purple-500/50 hover:from-purple-500 hover:via-purple-400 hover:to-violet-400'
              }`}
          >
            <span>{currentStep === 4 ? 'Get My Quote' : currentStep === 3 ? 'Build My Quote' : 'Continue'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        );
      })()}
    </div>
  );
};

export default WizardV5;
