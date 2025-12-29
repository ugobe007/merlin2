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

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Home } from 'lucide-react';

// Design System
import { COLORS, WIZARD_STEPS } from './design-system';
import { WizardErrorBoundary } from './components/ErrorBoundary';

// Step Components
import { Step1LocationGoals } from './steps/Step1LocationGoals';
import { Step2IndustrySelect } from './steps/Step2IndustrySelect';
import { Step3FacilityDetails } from './steps/Step3FacilityDetails';
import { MerlinInsightModal as OpportunityDiscoveryModal, type OpportunityPreferences } from './components/MerlinInsightModal';
import { Step3RecommendationModal, type OpportunityConfiguration } from './components/Step3RecommendationModal';
import { MerlinRecommendationModal, type SystemRecommendation, type FinancialSummary } from './components/MerlinRecommendationModal';
import { QuoteEngine } from '@/core/calculations';
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
  // Step 1 - Location & Goals & Grid Connection
  state: string;
  zipCode: string;
  goals: string[];
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
  // Step 2 - Industry
  selectedIndustry: string;
  industryName: string;
  
  // Opportunity Preferences (set in Phase 2)
  opportunityPreferences?: {
    wantsSolar: boolean;
    wantsGenerator: boolean;
    wantsEV: boolean;
  };
  
  // Step 3 - Facility Details
  facilitySubtype: string;
  useCaseData: Record<string, any>;
  
  // Step 4 - Magic Fit (System sizing)
  batteryKW: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;
  
  // Step 5 - Quote
  quoteResult: any | null;
  
  // UI State
  electricityRate: number;
}

const DEFAULT_STATE: WizardState = {
  state: '',
  zipCode: '',
  goals: [],
  gridConnection: 'on-grid',
  selectedIndustry: '',
  industryName: '',
  facilitySubtype: '',
  useCaseData: {},
  batteryKW: 500,
  durationHours: 4,
  solarKW: 0,
  generatorKW: 0,
  quoteResult: null,
  electricityRate: 0.12,
  opportunityPreferences: undefined,
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
  const [showMerlinInsightModal, setShowMerlinInsightModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [showMerlinRecommendation, setShowMerlinRecommendation] = useState(false);
  const [calculatedRecommendation, setCalculatedRecommendation] = useState<SystemRecommendation | null>(null);
  const [calculatedFinancials, setCalculatedFinancials] = useState<FinancialSummary | null>(null);

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

  // Calculate recommendation and financials for MerlinRecommendationModal
  const calculateMerlinRecommendation = async (updates: Partial<WizardState>) => {
    console.log('🔮 calculateMerlinRecommendation called with updates:', updates);
    try {
      const finalState = { ...wizardState, ...updates };
      console.log('🔮 calculateMerlinRecommendation - finalState.opportunityPreferences:', finalState.opportunityPreferences);
      const batteryKW = finalState.batteryKW || 500;
      const batteryKWH = batteryKW * (finalState.durationHours || 4);
      const solarKW = finalState.solarKW || 0;
      const generatorKW = finalState.generatorKW || 0;
      
      // Generate quote to get financials
      const quote = await QuoteEngine.generateQuote({
        storageSizeMW: batteryKW / 1000,
        durationHours: finalState.durationHours || 4,
        location: finalState.state,
        electricityRate: finalState.electricityRate || 0.12,
        useCase: finalState.selectedIndustry,
        solarMW: solarKW / 1000,
        generatorMW: generatorKW / 1000,
        gridConnection: finalState.gridConnection,
      });

      // Build recommendation
      const recommendation: SystemRecommendation = {
        batteryKW,
        batteryKWH,
        solarKW: solarKW > 0 ? solarKW : undefined,
        generatorKW: generatorKW > 0 ? generatorKW : undefined,
        evStations: finalState.opportunityPreferences?.wantsEV && finalState.useCaseData
          ? {
              level2Count: finalState.useCaseData.numberOfLevel2Chargers || 0,
              dcFastCount: finalState.useCaseData.numberOfDCFastChargers || 0,
            }
          : undefined,
      };

      // Build financial summary
      const financials: FinancialSummary = {
        totalInvestment: quote.costs.netCost || quote.costs.totalProjectCost,
        annualSavings: quote.financials.annualSavings,
        paybackYears: quote.financials.paybackYears,
        roi10Year: quote.financials.roi10Year || 0,
        npv: quote.financials.npv || 0,
      };

      console.log('🔮 calculateMerlinRecommendation - calculated recommendation:', recommendation);
      console.log('🔮 calculateMerlinRecommendation - calculated financials:', financials);
      setCalculatedRecommendation(recommendation);
      setCalculatedFinancials(financials);
      setShowMerlinRecommendation(true); // Show the final recommendation modal
      console.log('🔮 calculateMerlinRecommendation - setShowMerlinRecommendation(true)');
    } catch (error) {
      console.error('Failed to calculate recommendation:', error);
      // Fallback: proceed directly to Step 4
      setShowRecommendationModal(false);
      setCurrentStep(3);
    }
  };

  // Step Navigation
  const goToStep = useCallback((step: number) => {
    if (step < 0 || step > 4) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsTransitioning(false);
    }, 200);
  }, []);

  // Handle step navigation - intercept Step 3 Continue to show configuration modal
  const nextStep = useCallback(() => {
    // If we're on Step 3 (index 2) and user has selected opportunities, show configuration modal
    if (currentStep === 2 && wizardState.opportunityPreferences) {
      const hasOpportunities = wizardState.opportunityPreferences.wantsSolar || 
                              wizardState.opportunityPreferences.wantsGenerator || 
                              wizardState.opportunityPreferences.wantsEV;
      if (hasOpportunities) {
        setShowRecommendationModal(true);
        return; // Don't advance step yet - wait for modal confirmation
      }
    }
    // Otherwise, proceed normally
    goToStep(currentStep + 1);
  }, [currentStep, goToStep, wizardState.opportunityPreferences]);
  const prevStep = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep]);

  // Update state helper
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => {
      const newState = { ...prev, ...updates };
      if (import.meta.env.DEV && updates.opportunityPreferences !== undefined) {
        console.log('🔮 updateState called with opportunityPreferences:', updates.opportunityPreferences);
        console.log('🔮 updateState - prev state opportunityPreferences:', prev.opportunityPreferences);
        console.log('🔮 updateState - new state opportunityPreferences:', newState.opportunityPreferences);
      }
      return newState;
    });
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
      case 0: {
        const solarData = getSolarData(wizardState.state);
        return (
          <>
            <Step1LocationGoals
              state={wizardState.state}
              zipCode={wizardState.zipCode}
              goals={wizardState.goals}
              gridConnection={wizardState.gridConnection}
              electricityRate={wizardState.electricityRate}
              peakSunHours={solarData.peakSunHours}
              solarRating={solarData.rating}
              onStateChange={(v) => updateState({ state: v })}
              onZipCodeChange={(v) => updateState({ zipCode: v })}
              onGoalsChange={(v) => updateState({ goals: v })}
              onGridConnectionChange={(v) => updateState({ gridConnection: v })}
              onElectricityRateChange={(rate) => updateState({ electricityRate: rate })}
              onContinue={() => goToStep(1)}
              onOpenAdvanced={onOpenAdvanced}
            />
          </>
        );
      }
      
      case 1: {
        const solarDataStep2 = getSolarData(wizardState.state);
        return (
          <>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-white/60">Loading...</div></div>}>
              <Step2IndustrySelect
                selectedIndustry={wizardState.selectedIndustry}
                onIndustrySelect={(slug, name) => {
                  updateState({ selectedIndustry: slug, industryName: name });
                  // Trigger Merlin Insight Modal after industry selection
                  setShowMerlinInsightModal(true);
                }}
                solarOpportunity={getSolarOpportunity(wizardState.state)}
                onSolarClick={() => setShowSolarModal(true)}
                state={wizardState.state}
                electricityRate={wizardState.electricityRate}
                peakSunHours={solarDataStep2.peakSunHours}
                solarRating={solarDataStep2.rating}
              />
            </Suspense>
            
            {/* Merlin Insight Modal - appears after industry selection */}
            {wizardState.selectedIndustry && wizardState.state && (
              <OpportunityDiscoveryModal
                isOpen={showMerlinInsightModal}
                onClose={() => {
                  setShowMerlinInsightModal(false);
                  // If user closes without selecting, still proceed to Step 3 with default preferences
                  if (!wizardState.opportunityPreferences) {
                    updateState({ 
                      opportunityPreferences: { 
                        wantsSolar: false, 
                        wantsGenerator: false, 
                        wantsEV: false 
                      } 
                    });
                  }
                  // Proceed to Step 3 after a short delay
                  setTimeout(() => setCurrentStep(2), 300);
                }}
                onConfirm={(preferences) => {
                  console.log('🔮 MerlinInsightModal onConfirm - preferences received:', preferences);
                  updateState({ opportunityPreferences: preferences });
                  console.log('🔮 Wizard state updated, opportunityPreferences:', preferences);
                  setShowMerlinInsightModal(false);
                  // Proceed to Step 3 after preferences are set
                  setTimeout(() => setCurrentStep(2), 300);
                }}
                state={wizardState.state}
                industry={wizardState.selectedIndustry}
                industryName={wizardState.industryName}
                gridConnection={wizardState.gridConnection}
              />
            )}
          </>
        );
      }
      
      case 2: {
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-white/60">Loading...</div></div>}>
            <Step3FacilityDetails
            selectedIndustry={wizardState.selectedIndustry}
            industryName={wizardState.industryName}
            useCaseData={wizardState.useCaseData}
            onDataChange={(field, value) => updateState({ 
              useCaseData: { ...wizardState.useCaseData, [field]: value } 
            })}
            // Removed: onSolarConfigClick, onEVConfigClick, solarKW, evChargerCount
            // Solar/EV configuration now happens in Step 2 (MerlinInsightModal)
            state={wizardState.state}
            zipCode={wizardState.zipCode}
            goals={wizardState.goals}
            electricityRate={wizardState.electricityRate}
            batteryKW={wizardState.batteryKW}
            durationHours={wizardState.durationHours}
            generatorKW={wizardState.generatorKW}
            gridConnection={wizardState.gridConnection}
            onOpenAdvanced={onOpenAdvanced}
            opportunityPreferences={wizardState.opportunityPreferences}
            onReviewRecommendations={() => setShowRecommendationModal(true)}
          />
          </Suspense>
        );
      }
      
      case 3: {
        // Memoize useCaseData to prevent infinite effect loop in Step4MagicFit
        // useCaseData passed directly (useMemo removed - hooks cant be conditional)
        if (import.meta.env.DEV) {
          console.log('🔮 WizardV5 case 3 (Step 4) - Rendering Step4MagicFit');
          console.log('🔮 WizardV5 case 3 - wizardState.opportunityPreferences:', wizardState.opportunityPreferences);
        }
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-white/60">Loading...</div></div>}>
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
            opportunityPreferences={wizardState.opportunityPreferences}
            onBatteryChange={(v) => updateState({ batteryKW: v })}
            onDurationChange={(v) => updateState({ durationHours: v })}
            onSolarChange={(v) => updateState({ solarKW: v })}
            onGeneratorChange={(v) => updateState({ generatorKW: v })}
            onContinue={nextStep}
            onOpenAdvanced={onOpenAdvanced}
          />
          </Suspense>
        );
      }
      
      case 4: {
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-white/60">Loading...</div></div>}>
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
          </Suspense>
        );
      }
      
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

  // Debug: Log when component renders to verify it's the correct one
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 WizardV5 rendered - No fixed bottom nav should exist');
    }
  }, []);

  return (
    <div 
      className={`min-h-screen h-full bg-gradient-to-br ${COLORS.background.page} flex flex-col wizard-v5-container`} 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
      data-wizard-v5="true"
    >
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

      {/* Step 3 Recommendation Modal */}
      <Step3RecommendationModal
        isOpen={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        onConfirm={(configuration: OpportunityConfiguration) => {
          // Update wizard state with configuration (preferences + sizes)
          const updates: Partial<WizardState> = {
            opportunityPreferences: {
              wantsSolar: configuration.wantsSolar,
              wantsGenerator: configuration.wantsGenerator,
              wantsEV: configuration.wantsEV,
            },
            // Store configured sizes
            solarKW: configuration.solarKW || 0,
            generatorKW: configuration.generatorKW || 0,
          };
          
          // Update useCaseData with EV config if provided
          if (configuration.evConfig) {
            updates.useCaseData = {
              ...wizardState.useCaseData,
              numberOfLevel2Chargers: configuration.evConfig.level2Count || 0,
              numberOfDCFastChargers: configuration.evConfig.dcFastCount || 0,
            };
          }
          
          console.log('🔮 Step3RecommendationModal onConfirm - configuration received:', configuration);
          console.log('🔮 Step3RecommendationModal onConfirm - updates to apply:', updates);
          setWizardState(prev => {
            const newState = { ...prev, ...updates };
            console.log('🔮 Step3RecommendationModal onConfirm - new wizard state opportunityPreferences:', newState.opportunityPreferences);
            return newState;
          });
          // Close Step3RecommendationModal and calculate recommendation for MerlinRecommendationModal
          setShowRecommendationModal(false);
          calculateMerlinRecommendation(updates).then(() => {
            console.log('🔮 Step3RecommendationModal onConfirm - calculateMerlinRecommendation complete');
          });
        }}
        state={wizardState.state}
        zipCode={wizardState.zipCode}
        gridConnection={wizardState.gridConnection}
        electricityRate={wizardState.electricityRate}
        industry={wizardState.selectedIndustry}
        industryLabel={wizardState.industryName}
        useCaseData={wizardState.useCaseData}
        goals={wizardState.goals}
        baselineKW={wizardState.useCaseData.baselineKW}
        peakKW={wizardState.useCaseData.peakKW}
        initialPreferences={wizardState.opportunityPreferences}
      />

          {/* Merlin Recommendation Modal - Shows after Step3RecommendationModal confirms */}
      {calculatedRecommendation && calculatedFinancials && (
        <MerlinRecommendationModal
          isOpen={showMerlinRecommendation}
          onClose={() => {
            console.log('🔮 MerlinRecommendationModal onClose');
            setShowMerlinRecommendation(false);
            setCurrentStep(3); // Go to Step 4
          }}
          onAccept={() => {
            console.log('🔮 MerlinRecommendationModal onAccept - proceeding to Step 4');
            setShowMerlinRecommendation(false);
            setCurrentStep(3); // Go to Step 4 (Magic Fit)
          }}
          onProQuote={onOpenAdvanced}
          state={wizardState.state}
          industryName={wizardState.industryName}
          preferences={wizardState.opportunityPreferences}
          recommendation={calculatedRecommendation}
          financials={calculatedFinancials}
          gridConnection={wizardState.gridConnection}
          electricityRate={wizardState.electricityRate}
          industry={wizardState.selectedIndustry}
        />
      )}
      {import.meta.env.DEV && (() => {
        console.log('🔮 WizardV5 render - showMerlinRecommendation:', showMerlinRecommendation);
        console.log('🔮 WizardV5 render - calculatedRecommendation:', calculatedRecommendation);
        console.log('🔮 WizardV5 render - calculatedFinancials:', calculatedFinancials);
        console.log('🔮 WizardV5 render - wizardState.opportunityPreferences:', wizardState.opportunityPreferences);
        return null;
      })()}

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
        data-wizard-content
        style={{ 
          height: 'calc(100vh - 200px)',
          paddingBottom: '100px', // Space for bottom nav bar
        }}
      >
        <div className="max-w-4xl mx-auto" style={{ padding: '1.5rem 1rem 4rem 1rem' }}>
          <WizardErrorBoundary 
            stepName={WIZARD_STEPS[currentStep]?.title || `Step ${currentStep + 1}`}
            onReset={() => {
              // Reset error state and go back one step
              setCurrentStep(Math.max(0, currentStep - 1));
            }}
          >
            {renderStep()}
          </WizardErrorBoundary>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/80 backdrop-blur-lg border-t border-white/10 px-6 py-4 z-[1000]"
        data-wizard-v5-nav="true"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-8 py-3 rounded-2xl text-base font-semibold transition-all flex items-center gap-2 ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Step Indicator (optional) */}
          <div className="text-sm text-white/40 font-medium">
            Step {currentStep + 1} of 5
          </div>

          {/* Next/Continue Button */}
          <button
            onClick={nextStep}
            disabled={currentStep === 4}
            className={`px-10 py-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-3 ${
              currentStep === 4
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6] text-white shadow-xl shadow-[#6700b6]/30 hover:shadow-[#6700b6]/50 hover:scale-105 border-2 border-[#ad42ff]'
            }`}
          >
            {currentStep === 0 
              ? 'Continue to Industry Selection'
              : currentStep === 1
              ? 'Continue to Details'
              : currentStep === 2
              ? 'Continue to System'
              : currentStep === 3
              ? 'Continue to Quote'
              : 'Complete'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WizardV5;










