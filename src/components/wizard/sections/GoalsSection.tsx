// ═══════════════════════════════════════════════════════════════════════════
// GOALS SECTION (Section 3 - Dec 2025)
// REFACTORED Dec 16, 2025: Sub-components extracted to goals/ folder
// User tells us what matters FIRST, then we show tailored savings options
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { FACILITY_PRESETS } from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';
import { MerlinRecommendationPanel } from './MerlinRecommendationPanel';

// Import extracted sub-components from goals/ folder
import { EVChargersExisting, EVChargersNew } from './goals/GoalsEVChargers';
import { SolarToggle, SolarCanopyToggle, WindToggle } from './goals/GoalsRenewables';
import { GeneratorToggle, GridConnectionSection } from './goals/GoalsInfrastructure';

interface MerlinRecommendation {
  solarKW: number;
  windKW: number;
  generatorKW: number;
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  pcsKW: number;
  transformerKVA: number;
  totalProductionKW: number;
  totalStorageKWh: number;
  dailyProductionKWh: number;
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  currency: string;
}

interface GoalsSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  /** Generates 3 scenario options (Phase 3 - Dec 2025) */
  onGenerateScenarios?: () => void;
  /** Whether scenarios are currently being generated */
  isGeneratingScenarios?: boolean;
  /** Power coverage percentage (0-200). If < 100, user needs more power */
  powerCoverage?: number;
  /** Peak demand in kW from centralizedState */
  peakDemandKW?: number;
  /** Merlin's calculated recommendation */
  merlinRecommendation?: MerlinRecommendation;
}

export function GoalsSection({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  onGenerateScenarios,
  isGeneratingScenarios = false,
  powerCoverage = 100,
  peakDemandKW = 500,
  merlinRecommendation,
}: GoalsSectionProps) {
  const isEVChargingUseCase = wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging';
  const needsMorePower = powerCoverage < 100;
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // Dec 16, 2025 - SSOT FIX: Don't generate fake numbers!
  // If merlinRecommendation is provided, use it (it comes from SSOT)
  // If not, show zeros and indicate "calculating..." state
  const defaultRecommendation: MerlinRecommendation = React.useMemo(() => {
    // ALWAYS prefer the passed-in recommendation from SSOT
    if (merlinRecommendation) return merlinRecommendation;
    
    // Fallback: Calculate equipment sizing only (no fake financial numbers!)
    // Financial numbers will be 0 until SSOT calculates them
    const evChargerLoad = (
      (wizardState.existingEVL1 * 1.4) +
      (wizardState.existingEVL2 * 11) +
      (wizardState.existingEVL3 * 100) +
      (wizardState.evChargersL1 * 1.4) +
      (wizardState.evChargersL2 * 11) +
      (wizardState.evChargersDCFC * 150) +
      (wizardState.evChargersHPC * 350)
    );
    
    const totalPeakDemand = peakDemandKW + evChargerLoad;
    
    // Equipment sizing uses industry ratios (these are SSOT-aligned)
    const batteryKW = Math.round(totalPeakDemand * 0.4);
    const batteryKWh = batteryKW * 4;
    
    return {
      solarKW: Math.round(totalPeakDemand * 0.6),
      windKW: 0,
      generatorKW: Math.round(totalPeakDemand * 0.25),
      batteryKW: batteryKW,
      batteryKWh: batteryKWh,
      durationHours: 4,
      pcsKW: batteryKW,
      transformerKVA: Math.round(totalPeakDemand * 0.5),
      totalProductionKW: Math.round(totalPeakDemand * 0.85),
      totalStorageKWh: batteryKWh,
      dailyProductionKWh: Math.round(totalPeakDemand * 0.6 * 4.5),
      // CRITICAL: Don't fake financial numbers! Show 0 until SSOT calculates
      annualSavings: 0,
      paybackYears: 0,
      roi10Year: 0,
      currency: 'USD',
    };
  }, [
    peakDemandKW,
    merlinRecommendation,
    wizardState.existingEVL1,
    wizardState.existingEVL2,
    wizardState.existingEVL3,
    wizardState.evChargersL1,
    wizardState.evChargersL2,
    wizardState.evChargersDCFC,
    wizardState.evChargersHPC,
  ]);

  // Store recommendation in ref to avoid callback recreation on every render
  const recommendationRef = React.useRef(defaultRecommendation);
  
  // Update ref whenever recommendation changes
  React.useEffect(() => {
    recommendationRef.current = defaultRecommendation;
  }, [defaultRecommendation]);

  // Auto-populate on first load only - DO NOT continuously sync
  React.useEffect(() => {
    if (currentSection === 3 && !hasAutoPopulated) {
      // Only populate ONCE when user first arrives at this section
      const rec = recommendationRef.current;
      setWizardState(prev => ({
        ...prev,
        solarKW: rec.solarKW,
        wantsSolar: rec.solarKW > 0,
        windTurbineKW: rec.windKW,
        wantsWind: rec.windKW > 0,
        generatorKW: rec.generatorKW,
        wantsGenerator: rec.generatorKW > 0,
        batteryKW: rec.batteryKW,
        batteryKWh: rec.batteryKWh,
        durationHours: rec.durationHours,
      }));
      setHasAutoPopulated(true);
    }
    // CRITICAL: Do NOT include setWizardState in deps - causes re-run after Accept button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, hasAutoPopulated]);
  
  // Removed scroll preservation - was causing unwanted page jumps when toggling add-ons

  // User's current selection
  const userSelection = {
    solarKW: wizardState.solarKW || 0,
    windKW: wizardState.windTurbineKW || 0,
    generatorKW: wizardState.generatorKW || 0,
    batteryKW: wizardState.batteryKW || 0,
    batteryKWh: wizardState.batteryKWh || 0,
    durationHours: wizardState.durationHours || 4,
  };

  // Accept Merlin's recommendation - stable callback using ref
  const handleAcceptRecommendation = React.useCallback(() => {
    console.log('✅ Accepting recommendation from ref:', recommendationRef.current);
    const rec = recommendationRef.current;
    
    // Use a single setState to batch all updates
    setWizardState(prev => ({
      ...prev,
      solarKW: rec.solarKW,
      wantsSolar: rec.solarKW > 0,
      windTurbineKW: rec.windKW,
      wantsWind: rec.windKW > 0,
      generatorKW: rec.generatorKW,
      wantsGenerator: rec.generatorKW > 0,
      batteryKW: rec.batteryKW,
      batteryKWh: rec.batteryKWh,
      durationHours: rec.durationHours,
    }));
    
    // Show detailed popup with accepted values
    const formatKW = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${kw} kW`;
    const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${kwh} kWh`;
    
    const summary = `✅ RECOMMENDATION ACCEPTED!\n\n🔋 BATTERY STORAGE:\n• Power: ${formatKW(rec.batteryKW)}\n• Capacity: ${formatKWh(rec.batteryKWh)}\n• Duration: ${rec.durationHours} hours\n\n${rec.solarKW > 0 ? `☀️ SOLAR: ${formatKW(rec.solarKW)}\n\n` : ''}${rec.windKW > 0 ? `🌪️ WIND: ${formatKW(rec.windKW)}\n\n` : ''}${rec.generatorKW > 0 ? `⚡ GENERATOR: ${formatKW(rec.generatorKW)}\n\n` : ''}These settings have been applied to the configuration sliders below.`;
    
    alert(summary);
  }, [setWizardState]);

  // GoalsSection is Section 3 - User tells us what matters BEFORE we show scenarios
  return (
    <div
      ref={sectionRef}
      className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 3 ? 'hidden' : ''}`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Facility Details
          </button>
          <div className="text-sm text-gray-400">Step 3 of 5 • Configure Add-ons</div>
        </div>

        {/* Progress badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">{wizardState.state}</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">{wizardState.industryName}</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">
              {wizardState.facilitySize.toLocaleString()} {FACILITY_PRESETS[wizardState.selectedIndustry]?.unit || 'sq ft'}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            MERLIN'S RECOMMENDED CONFIGURATION PANEL - MAIN CALL TO ACTION
            Shows complete recommendation with savings, equipment, and energy profile
            Dec 14, 2025: Made this the primary CTA, removed redundant instruction panel
            ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <MerlinRecommendationPanel
            recommendation={defaultRecommendation}
            userSelection={userSelection}
            peakDemandKW={peakDemandKW}
            industryName={wizardState.industryName || 'your facility'}
            onAcceptRecommendation={handleAcceptRecommendation}
            expanded={showEquipmentDetails}
            onToggleExpanded={() => setShowEquipmentDetails(!showEquipmentDetails)}
          />
        </div>

        {/* Explanation Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50 rounded-2xl">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-bold text-white mb-2">👇 Review & Customize Below</h4>
              <p className="text-blue-200">
                Merlin pre-filled optimal settings based on your facility. <strong className="text-white">Review each numbered section below</strong> and adjust if needed. 
                Your changes update the recommendation in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* EV Chargers Section - Existing - SECTION 1 */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="text-lg font-bold text-white">Existing EV Chargers</h3>
          </div>
          <EVChargersExisting
            wizardState={wizardState}
            setWizardState={setWizardState}
            isEVChargingUseCase={isEVChargingUseCase}
          />
        </div>

        {/* EV Chargers Section - New - SECTION 2 */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-lg font-bold text-white">Add New EV Chargers</h3>
          </div>
          <EVChargersNew
            wizardState={wizardState}
            setWizardState={setWizardState}
            isEVChargingUseCase={isEVChargingUseCase}
          />
        </div>

        {/* Solar Toggle - SECTION 3 */}
        <div className="mb-4" data-section="solar-config">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="text-lg font-bold text-white">Solar Power</h3>
            {needsMorePower && <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">RECOMMENDED</span>}
          </div>
          <SolarToggle wizardState={wizardState} setWizardState={setWizardState} highlightForPower={needsMorePower} />
        </div>

        {/* Solar Canopy Toggle - SECTION 3B (Dec 2025) */}
        <div className="mb-4" data-section="solar-canopy-config">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-green-500 text-white flex items-center justify-center font-bold text-sm">3B</div>
            <h3 className="text-lg font-bold text-white">Solar Parking Canopy</h3>
          </div>
          <SolarCanopyToggle wizardState={wizardState} setWizardState={setWizardState} />
        </div>

        {/* Wind Toggle - SECTION 4 */}
        <div className="mb-4" data-section="wind-config">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">4</div>
            <h3 className="text-lg font-bold text-white">Wind Power</h3>
          </div>
          <WindToggle wizardState={wizardState} setWizardState={setWizardState} />
        </div>

        {/* Generator Toggle - SECTION 5 */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-sm">5</div>
            <h3 className="text-lg font-bold text-white">Backup Generator</h3>
            {needsMorePower && <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">RECOMMENDED</span>}
          </div>
          <GeneratorToggle wizardState={wizardState} setWizardState={setWizardState} highlightForPower={needsMorePower} />
        </div>

        {/* Grid Connection - SECTION 6 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">6</div>
            <h3 className="text-lg font-bold text-white">Grid Connection Status</h3>
          </div>
          <GridConnectionSection wizardState={wizardState} setWizardState={setWizardState} />
        </div>

        {/* Continue button - Now with "See My Options" for scenario generation */}
        <div className="space-y-3">
          {/* Primary: Generate Scenarios */}
          {onGenerateScenarios && (
            <button
              onClick={onGenerateScenarios}
              disabled={isGeneratingScenarios}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              {isGeneratingScenarios ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Options...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  See My Options
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
          
          {/* Secondary: Skip to custom config */}
          <button
            onClick={onContinue}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            Skip to Custom Configuration <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS - NOW IMPORTED FROM goals/ FOLDER
// See: GoalsEVChargers.tsx, GoalsRenewables.tsx, GoalsInfrastructure.tsx
// ═══════════════════════════════════════════════════════════════════════════

