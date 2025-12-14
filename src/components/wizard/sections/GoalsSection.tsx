// ═══════════════════════════════════════════════════════════════════════════
// GOALS SECTION (Section 3)
// Extracted from StreamlinedWizard.tsx - Dec 2025 Refactor
// Updated Dec 12, 2025: Replaced Power Gap panel with Merlin Recommendation Panel
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Car,
  CheckCircle,
  Fuel,
  Info,
  Minus,
  Plus,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import {
  GOAL_OPTIONS,
  FACILITY_PRESETS,
  SOLAR_POWER_PRESETS,
  WIND_POWER_PRESETS,
  findClosestPresetIndex,
  SOLAR_TO_BESS_RATIO,
  WIND_TO_BESS_RATIO,
  GENERATOR_RESERVE_MARGIN,
  getCriticalLoadPercentage,
} from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';
import { MerlinRecommendationPanel } from './MerlinRecommendationPanel';

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
  powerCoverage = 100,
  peakDemandKW = 500,
  merlinRecommendation,
}: GoalsSectionProps) {
  const isEVChargingUseCase = wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging';
  const needsMorePower = powerCoverage < 100;
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // DYNAMIC RECOMMENDATION - Recalculates when peak demand or EV chargers change
  const defaultRecommendation: MerlinRecommendation = React.useMemo(() => {
    if (merlinRecommendation) return merlinRecommendation;
    
    // Calculate TOTAL peak demand including EV chargers
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
    
    return {
      solarKW: Math.round(totalPeakDemand * 0.6),
      windKW: 0,
      generatorKW: Math.round(totalPeakDemand * 0.25),
      batteryKW: Math.round(totalPeakDemand * 0.4),
      batteryKWh: Math.round(totalPeakDemand * 0.4 * 4),
      durationHours: 4,
      pcsKW: Math.round(totalPeakDemand * 0.4),
      transformerKVA: Math.round(totalPeakDemand * 0.5),
      totalProductionKW: Math.round(totalPeakDemand * 0.85),
      totalStorageKWh: Math.round(totalPeakDemand * 0.4 * 4),
      dailyProductionKWh: Math.round(totalPeakDemand * 0.6 * 4.5),
      annualSavings: Math.round(totalPeakDemand * 150),
      paybackYears: 3.5,
      roi10Year: 285,
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
            Back to Details
          </button>
          <div className="text-sm text-gray-400">Step 4 of 6</div>
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

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface SubComponentProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  /** Optional: highlight this option when user needs more power */
  highlightForPower?: boolean;
}

// Existing EV Chargers
function EVChargersExisting({ wizardState, setWizardState, isEVChargingUseCase }: SubComponentProps & { isEVChargingUseCase: boolean }) {
  if (isEVChargingUseCase) {
    // EV Charging use case - show summary
    return (
      <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-emerald-500">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">Your EV Charging Infrastructure</h4>
            <p className="text-sm text-gray-500">Pre-filled from your earlier selections</p>
          </div>
        </div>
        <ChargerLevelInputs
          l1={wizardState.existingEVL1}
          l2={wizardState.existingEVL2}
          dcfc={wizardState.existingEVL3}
          onL1Change={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
          onL2Change={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
          onDCFCChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
          colorClass="emerald"
        />
        <PowerSourceSelector wizardState={wizardState} setWizardState={setWizardState} />
        <TotalLoadDisplay
          l1={wizardState.existingEVL1}
          l2={wizardState.existingEVL2}
          dcfc={wizardState.existingEVL3}
          hpc={0}
          label="Total EV Load"
          colorClass="emerald"
        />
      </div>
    );
  }

  // Non-EV use cases - Yes/No question
  return (
    <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
      wizardState.hasExistingEV
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg'
        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${wizardState.hasExistingEV ? 'bg-emerald-500' : 'bg-gray-200'}`}>
          <Car className={`w-6 h-6 ${wizardState.hasExistingEV ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">Do you have EXISTING EV chargers?</h4>
          <p className="text-sm text-gray-500">Current charging infrastructure</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWizardState(prev => ({ ...prev, hasExistingEV: true }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.hasExistingEV === true ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >Yes</button>
          <button
            onClick={() => setWizardState(prev => ({
              ...prev, hasExistingEV: false, existingEVL1: 0, existingEVL2: 0, existingEVL3: 0, existingEVPowerSource: 'grid'
            }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.hasExistingEV === false ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >No</button>
        </div>
      </div>

      {wizardState.hasExistingEV && (
        <div className="mt-4 pt-4 border-t border-emerald-200 space-y-4">
          <ChargerLevelInputs
            l1={wizardState.existingEVL1}
            l2={wizardState.existingEVL2}
            dcfc={wizardState.existingEVL3}
            onL1Change={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
            onL2Change={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
            onDCFCChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
            colorClass="emerald"
          />
          <PowerSourceSelector wizardState={wizardState} setWizardState={setWizardState} />
          <TotalLoadDisplay
            l1={wizardState.existingEVL1}
            l2={wizardState.existingEVL2}
            dcfc={wizardState.existingEVL3}
            hpc={0}
            label="Total Existing EV Load"
            colorClass="emerald"
          />
        </div>
      )}
    </div>
  );
}

// New EV Chargers
function EVChargersNew({ wizardState, setWizardState, isEVChargingUseCase }: SubComponentProps & { isEVChargingUseCase: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
      wizardState.wantsEVCharging
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg'
        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${wizardState.wantsEVCharging ? 'bg-blue-500' : 'bg-gray-200'}`}>
          <Car className={`w-6 h-6 ${wizardState.wantsEVCharging ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {isEVChargingUseCase ? 'Expand charging capacity?' : 'Add NEW EV chargers?'}
          </h4>
          <p className="text-sm text-gray-500">
            {isEVChargingUseCase ? 'Add more chargers beyond current setup' : 'Plan for future charging'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWizardState(prev => ({ ...prev, wantsEVCharging: true }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.wantsEVCharging ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >Yes</button>
          <button
            onClick={() => setWizardState(prev => ({
              ...prev, wantsEVCharging: false, evChargersL2: 0, evChargersDCFC: 0, evChargersHPC: 0
            }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.wantsEVCharging === false ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >No</button>
        </div>
      </div>

      {wizardState.wantsEVCharging && (
        <div className="mt-4 pt-4 border-t border-blue-200 space-y-4" style={{ scrollMarginTop: '100px' }}>
          <NewChargerInputs wizardState={wizardState} setWizardState={setWizardState} />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700">New EV Load</p>
              <p className="text-2xl font-black text-blue-600">
                {((wizardState.evChargersL1 || 0) * 1.4 + wizardState.evChargersL2 * 11 + wizardState.evChargersDCFC * 150 + wizardState.evChargersHPC * 350).toFixed(0)} kW
              </p>
            </div>
            <div className="bg-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700">Estimated Cost</p>
              <p className="text-2xl font-black text-blue-600">
                ${((wizardState.evChargersL1 || 0) * 3000 + wizardState.evChargersL2 * 10000 + wizardState.evChargersDCFC * 85000 + wizardState.evChargersHPC * 180000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Charger Level Inputs (reusable)
function ChargerLevelInputs({
  l1, l2, dcfc, onL1Change, onL2Change, onDCFCChange, colorClass
}: {
  l1: number; l2: number; dcfc: number;
  onL1Change: (v: number) => void;
  onL2Change: (v: number) => void;
  onDCFCChange: (v: number) => void;
  colorClass: 'emerald' | 'blue';
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <ChargerInput label="Level 1" power="1.4 kW" value={l1} onChange={onL1Change} colorClass={colorClass} multiplier={1.4} />
      <ChargerInput label="Level 2" power="7-11 kW" value={l2} onChange={onL2Change} colorClass={colorClass} multiplier={11} />
      <ChargerInput label="DCFC" power="50-150 kW" value={dcfc} onChange={onDCFCChange} colorClass={colorClass} multiplier={100} />
    </div>
  );
}

function ChargerInput({
  label, power, value, onChange, colorClass, multiplier
}: {
  label: string; power: string; value: number;
  onChange: (v: number) => void; colorClass: string; multiplier: number;
}) {
  return (
    <div className={`bg-white rounded-xl p-4 border border-${colorClass}-100`}>
      <h5 className="font-medium text-gray-700 mb-1">{label}</h5>
      <p className="text-xs text-gray-500 mb-3">{power} each</p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
        >-</button>
        <span className="text-2xl font-bold text-gray-800 w-12 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className={`w-8 h-8 bg-${colorClass}-100 hover:bg-${colorClass}-200 rounded-lg flex items-center justify-center font-bold`}
        >+</button>
      </div>
      <p className={`text-xs text-${colorClass}-600 text-center mt-2`}>{(value * multiplier).toFixed(1)} kW</p>
    </div>
  );
}

function NewChargerInputs({ wizardState, setWizardState }: SubComponentProps) {
  const inputs = [
    { key: 'evChargersL1', label: 'Level 1', power: '1.4 kW', cost: '~$3K', mult: 1.4 },
    { key: 'evChargersL2', label: 'Level 2', power: '11 kW', cost: '~$10K', mult: 11 },
    { key: 'evChargersDCFC', label: 'DCFC', power: '150 kW', cost: '~$85K', mult: 150 },
    { key: 'evChargersHPC', label: 'HPC', power: '350 kW', cost: '~$180K', mult: 350 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {inputs.map(({ key, label, power, cost, mult }) => (
        <div key={key} className="bg-white rounded-xl p-3 border border-blue-100">
          <h5 className="font-medium text-gray-700 text-sm mb-1">{label}</h5>
          <p className="text-xs text-gray-500 mb-1">{power}</p>
          <p className="text-xs text-blue-600 mb-2">{cost}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setWizardState(prev => ({ ...prev, [key]: Math.max(0, (prev[key as keyof WizardState] as number) - 1) }))}
              className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-sm"
            >-</button>
            <span className="text-xl font-bold text-gray-800 w-10 text-center">{wizardState[key as keyof WizardState] as number}</span>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, [key]: (prev[key as keyof WizardState] as number) + 1 }))}
              className="w-7 h-7 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center font-bold text-sm"
            >+</button>
          </div>
          <p className="text-xs text-blue-600 text-center mt-1">{((wizardState[key as keyof WizardState] as number) * mult).toFixed(0)} kW</p>
        </div>
      ))}
    </div>
  );
}

function PowerSourceSelector({ wizardState, setWizardState }: SubComponentProps) {
  const options = [
    { id: 'grid', label: 'Grid only', icon: '🔌' },
    { id: 'solar-grid', label: 'Solar + Grid', icon: '☀️' },
    { id: 'solar-only', label: 'Solar only', icon: '🌞' },
    { id: 'generator', label: 'Generator backup', icon: '⚡' },
  ];

  return (
    <div className="bg-white/50 rounded-xl p-4">
      <h5 className="font-medium text-gray-700 mb-3">How are your chargers powered?</h5>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setWizardState(prev => ({ ...prev, existingEVPowerSource: opt.id as any }))}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              wizardState.existingEVPowerSource === opt.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{opt.icon}</span> {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TotalLoadDisplay({ l1, l2, dcfc, hpc, label, colorClass }: { l1: number; l2: number; dcfc: number; hpc: number; label: string; colorClass: string }) {
  const total = (l1 * 1.4) + (l2 * 11) + (dcfc * 150) + (hpc * 350);
  return (
    <div className={`bg-${colorClass}-100 rounded-xl p-4 text-center`}>
      <p className={`text-sm text-${colorClass}-700`}>{label}</p>
      <p className={`text-2xl font-black text-${colorClass}-600`}>{total.toFixed(1)} kW</p>
    </div>
  );
}

// Solar Toggle
function SolarToggle({ wizardState, setWizardState, highlightForPower = false }: SubComponentProps) {
  // Highlight when user needs more power and hasn't selected solar yet
  const showHighlight = highlightForPower && !wizardState.wantsSolar;
  
  return (
    <div className={`rounded-2xl p-6 border-2 mb-4 transition-all relative overflow-hidden ${
      showHighlight
        ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-500 shadow-xl shadow-amber-500/40 animate-pulse ring-2 ring-amber-400 ring-offset-2'
        : wizardState.wantsSolar
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200'
    }`}>
      {/* Highlight banner when needs more power */}
      {showHighlight && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1 px-3 text-center">
          ⚡ RECOMMENDED - Add power to meet your needs!
        </div>
      )}
      
      <label className={`flex items-center gap-4 cursor-pointer ${showHighlight ? 'pt-6' : ''}`}>
        <input
          type="checkbox"
          checked={wizardState.wantsSolar}
          onChange={(e) => {
            const batteryKW = wizardState.batteryKW || 500;
            setWizardState(prev => ({
              ...prev,
              wantsSolar: e.target.checked,
              solarKW: e.target.checked ? Math.round(batteryKW * SOLAR_TO_BESS_RATIO) : 0
            }));
          }}
          className="w-6 h-6 rounded accent-amber-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sun className={`w-5 h-5 ${showHighlight ? 'text-amber-600 animate-bounce' : 'text-amber-500'}`} />
            <span className={`font-bold ${showHighlight ? 'text-amber-800' : 'text-gray-800'}`}>Add Solar Panels</span>
            {showHighlight && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                +Power!
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Generate your own power & maximize savings</p>
        </div>
        {wizardState.geoRecommendations && (
          <div className="text-right">
            <div className="text-amber-500 font-bold">{wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">solar/day</div>
          </div>
        )}
      </label>

      {wizardState.wantsSolar && (
        <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-amber-700 font-medium">Merlin recommends:</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-xs">
              {Math.round((wizardState.batteryKW || 500) * SOLAR_TO_BESS_RATIO)} kW
            </span>
          </div>

          <PowerSlider
            value={wizardState.solarKW}
            onChange={(v) => setWizardState(prev => ({ ...prev, solarKW: v }))}
            presets={SOLAR_POWER_PRESETS}
            colorClass="amber"
            label="Solar kW"
          />

          <RoofSpaceWarning wizardState={wizardState} />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Annual Gen</div>
              <div className="font-bold text-amber-700">
                {Math.round((wizardState.solarKW || 0) * (wizardState.geoRecommendations?.profile.avgSolarHoursPerDay || 5) * 365 / 1000).toLocaleString()} MWh
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-bold text-amber-700">480V 3-Phase</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-amber-700">${((wizardState.solarKW || 0) * 1200).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wind Toggle
function WindToggle({ wizardState, setWizardState }: SubComponentProps) {
  return (
    <div className={`rounded-2xl p-6 border-2 mb-4 transition-all ${
      wizardState.wantsWind
        ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400 shadow-lg shadow-sky-500/20'
        : 'bg-gradient-to-br from-sky-50/50 to-blue-50/50 border-sky-200'
    }`}>
      <label className="flex items-center gap-4 cursor-pointer">
        <input
          type="checkbox"
          checked={wizardState.wantsWind}
          onChange={(e) => {
            const batteryKW = wizardState.batteryKW || 500;
            setWizardState(prev => ({
              ...prev,
              wantsWind: e.target.checked,
              windTurbineKW: e.target.checked ? Math.round(batteryKW * WIND_TO_BESS_RATIO) : 0
            }));
          }}
          className="w-6 h-6 rounded accent-sky-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-sky-500" />
            <span className="font-bold text-gray-800">Add Wind Turbines</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Harness wind energy for 24/7 renewable generation</p>
        </div>
        {wizardState.geoRecommendations && (
          <div className="text-right">
            <div className="text-sky-500 font-bold">~{Math.round((wizardState.geoRecommendations.profile.windCapacityFactor || 0.25) * 30)} mph</div>
            <div className="text-xs text-gray-500">avg wind</div>
          </div>
        )}
      </label>

      {wizardState.wantsWind && (
        <div className="mt-4 pt-4 border-t border-sky-200 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-sky-700 font-medium">Merlin recommends:</span>
            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-xs">
              {Math.round((wizardState.batteryKW || 500) * WIND_TO_BESS_RATIO)} kW
            </span>
          </div>

          <PowerSlider
            value={wizardState.windTurbineKW}
            onChange={(v) => setWizardState(prev => ({ ...prev, windTurbineKW: v }))}
            presets={WIND_POWER_PRESETS}
            colorClass="sky"
            label="Wind kW"
          />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Capacity Factor</div>
              <div className="font-bold text-sky-700">~25-35%</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-bold text-sky-700">480V 3-Phase</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-sky-700">${((wizardState.windTurbineKW || 0) * 1800).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Generator Toggle
function GeneratorToggle({ wizardState, setWizardState, highlightForPower = false }: SubComponentProps) {
  // Highlight when user needs more power and hasn't selected generator yet
  const showHighlight = highlightForPower && !wizardState.wantsGenerator;
  
  return (
    <div className={`rounded-2xl p-6 border-2 mb-6 transition-all relative overflow-hidden ${
      showHighlight
        ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-500 shadow-xl shadow-blue-500/40 animate-pulse ring-2 ring-blue-400 ring-offset-2'
        : wizardState.wantsGenerator
          ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-400 shadow-lg shadow-slate-500/20'
          : 'bg-gradient-to-br from-slate-50/50 to-gray-50/50 border-slate-200'
    }`}>
      {/* Highlight banner when needs more power */}
      {showHighlight && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold py-1 px-3 text-center">
          ⚡ RECOMMENDED - Backup power for reliability!
        </div>
      )}
      
      <label className={`flex items-center gap-4 cursor-pointer ${showHighlight ? 'pt-6' : ''}`}>
        <input
          type="checkbox"
          checked={wizardState.wantsGenerator}
          onChange={(e) => {
            // Generator sizing v2.0: Critical Load × Reserve Margin (1.25)
            // Critical load depends on industry - get percentage from constants
            // Source: LADWP, NEC 700/701/702, WPP Sizing Guide
            const peakKW = wizardState.batteryKW || 500;
            const criticalLoadPct = getCriticalLoadPercentage(wizardState.selectedIndustry || 'default');
            const criticalLoadKW = peakKW * criticalLoadPct;
            const recommendedGeneratorKW = Math.round(criticalLoadKW * GENERATOR_RESERVE_MARGIN);
            
            setWizardState(prev => ({
              ...prev,
              wantsGenerator: e.target.checked,
              generatorKW: e.target.checked ? recommendedGeneratorKW : 0
            }));
          }}
          className="w-6 h-6 rounded accent-slate-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Fuel className={`w-5 h-5 ${showHighlight ? 'text-blue-600 animate-bounce' : 'text-slate-600'}`} />
            <span className={`font-bold ${showHighlight ? 'text-blue-800' : 'text-gray-800'}`}>Add Backup Generator</span>
            {showHighlight && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                +Power!
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Extended backup for critical operations</p>
        </div>
        {wizardState.wantsGenerator && (
          <select
            value={wizardState.generatorFuel}
            onChange={(e) => setWizardState(prev => ({ ...prev, generatorFuel: e.target.value as any }))}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-purple-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
          >
            <option value="natural-gas">Natural Gas</option>
            <option value="diesel">Diesel</option>
            <option value="propane">Propane</option>
          </select>
        )}
      </label>

      {wizardState.wantsGenerator && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          {/* Generator Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'traditional' }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                wizardState.generatorType !== 'linear' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <span className="font-bold text-sm text-gray-800">Traditional</span>
              </div>
              <p className="text-xs text-gray-500">Diesel/NG engines</p>
            </button>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'linear' }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                wizardState.generatorType === 'linear' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔋</span>
                <span className="font-bold text-sm text-gray-800">Linear Generator</span>
              </div>
              <p className="text-xs text-gray-500">Mainspring, Bloom Energy</p>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700 font-medium">Merlin recommends:</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold text-xs">
              {Math.round((wizardState.batteryKW || 500) * getCriticalLoadPercentage(wizardState.selectedIndustry || 'default') * GENERATOR_RESERVE_MARGIN)} kW
            </span>
            <span className="text-xs text-gray-400">
              ({Math.round(getCriticalLoadPercentage(wizardState.selectedIndustry || 'default') * 100)}% critical load × 1.25)
            </span>
          </div>

          {/* Generator Power Slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-24">Generator:</span>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorKW: Math.max(50, prev.generatorKW - 100) }))}
              className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
            ><Minus className="w-5 h-5" /></button>
            <div className="flex-1">
              <input
                type="range"
                min="50"
                max="20000"
                step="50"
                value={wizardState.generatorKW}
                onChange={(e) => setWizardState(prev => ({ ...prev, generatorKW: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
            </div>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorKW: Math.min(20000, prev.generatorKW + 100) }))}
              className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
            ><Plus className="w-5 h-5" /></button>
            <div className="w-32 text-right">
              {wizardState.generatorKW >= 1000 ? (
                <><span className="text-2xl font-black text-slate-700">{(wizardState.generatorKW / 1000).toFixed(1)}</span><span className="text-sm text-gray-500 ml-1">MW</span></>
              ) : (
                <><span className="text-2xl font-black text-slate-700">{wizardState.generatorKW}</span><span className="text-sm text-gray-500 ml-1">kW</span></>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Fuel Type</div>
              <div className="font-bold text-slate-700 capitalize">{wizardState.generatorFuel.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-bold text-slate-700">480V 3Φ</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Amperage</div>
              <div className="font-bold text-slate-700">{Math.round(wizardState.generatorKW / 0.48 / 1.732)}A</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-slate-700">${(wizardState.generatorKW * (wizardState.generatorType === 'linear' ? 2500 : 800)).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Grid Connection Section
function GridConnectionSection({ wizardState, setWizardState }: SubComponentProps) {
  const options = [
    { id: 'on-grid' as const, label: 'Grid-Tied', description: 'Reliable connection', icon: '🔌' },
    { id: 'unreliable' as const, label: 'Unreliable Grid', description: 'Frequent outages', icon: '⚠️' },
    { id: 'expensive' as const, label: 'Grid Too Expensive', description: 'High rates', icon: '💰' },
    { id: 'limited' as const, label: 'Limited Grid', description: 'Constrained capacity', icon: '📉' },
    { id: 'off-grid' as const, label: 'Off-Grid', description: 'No utility', icon: '🏝️' },
  ];

  return (
    <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 mb-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gray-100">
          <Zap className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800">Grid Connection Status</h4>
          <p className="text-sm text-gray-500">How is your facility connected?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setWizardState(prev => ({ ...prev, gridConnection: option.id }))}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              wizardState.gridConnection === option.id
                ? 'border-purple-400 bg-purple-50 shadow-lg shadow-purple-500/20'
                : 'border-gray-200 bg-white hover:border-purple-400/50'
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <div className={`font-bold text-sm ${wizardState.gridConnection === option.id ? 'text-purple-700' : 'text-gray-700'}`}>
              {option.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {wizardState.gridConnection !== 'on-grid' && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          wizardState.gridConnection === 'off-grid' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
          wizardState.gridConnection === 'expensive' ? 'bg-green-50 border border-green-200 text-green-700' :
          wizardState.gridConnection === 'unreliable' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              {wizardState.gridConnection === 'off-grid' && 'Off-grid systems require larger battery capacity and backup generation.'}
              {wizardState.gridConnection === 'expensive' && 'BESS + solar can dramatically reduce your energy costs.'}
              {wizardState.gridConnection === 'unreliable' && 'We\'ll recommend backup power and longer battery duration.'}
              {wizardState.gridConnection === 'limited' && 'Limited grid means we\'ll size for greater self-reliance.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Power Slider (reusable)
function PowerSlider({
  value, onChange, presets, colorClass, label
}: {
  value: number; onChange: (v: number) => void;
  presets: { value: number; label: string }[];
  colorClass: string; label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-20">{label}:</span>
      <button
        onClick={() => {
          const idx = findClosestPresetIndex(value, presets);
          const newIdx = Math.max(0, idx - 1);
          onChange(presets[newIdx].value);
        }}
        className={`w-10 h-10 bg-${colorClass}-100 hover:bg-${colorClass}-200 rounded-lg flex items-center justify-center text-${colorClass}-700 font-bold`}
      ><Minus className="w-5 h-5" /></button>
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={presets.length - 1}
          step={1}
          value={findClosestPresetIndex(value, presets)}
          onChange={(e) => onChange(presets[parseInt(e.target.value)].value)}
          className={`w-full h-2 bg-${colorClass}-200 rounded-lg appearance-none cursor-pointer accent-${colorClass}-500`}
        />
      </div>
      <button
        onClick={() => {
          const idx = findClosestPresetIndex(value, presets);
          const newIdx = Math.min(presets.length - 1, idx + 1);
          onChange(presets[newIdx].value);
        }}
        className={`w-10 h-10 bg-${colorClass}-100 hover:bg-${colorClass}-200 rounded-lg flex items-center justify-center text-${colorClass}-700 font-bold`}
      ><Plus className="w-5 h-5" /></button>
      <div className="w-28 text-right">
        {value >= 1000 ? (
          <><span className={`text-2xl font-black text-${colorClass}-600`}>{(value / 1000).toFixed(1)}</span><span className="text-sm text-gray-500 ml-1">MW</span></>
        ) : (
          <><span className={`text-2xl font-black text-${colorClass}-600`}>{value}</span><span className="text-sm text-gray-500 ml-1">kW</span></>
        )}
      </div>
    </div>
  );
}

// Roof Space Warning
function RoofSpaceWarning({ wizardState }: { wizardState: WizardState }) {
  const solarKW = wizardState.solarKW || 0;
  const sqFt = wizardState.facilitySize || 0;
  const estimatedRoofNeeded = solarKW * 100;
  const ROOF_USABLE_FACTOR = 0.6;
  const estimatedRoofAvailable = sqFt * ROOF_USABLE_FACTOR;
  const isOversized = solarKW > 0 && sqFt > 0 && estimatedRoofNeeded > estimatedRoofAvailable;

  if (!isOversized) return null;

  return (
    <div className="p-3 bg-yellow-100 border border-yellow-400 rounded-lg mb-4">
      <div className="flex items-start gap-2 text-yellow-800 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Space Consideration:</strong> {solarKW >= 1000 ? `${(solarKW/1000).toFixed(1)} MW` : `${solarKW} kW`} solar typically needs ~{estimatedRoofNeeded.toLocaleString()} sq ft.
          Your {sqFt.toLocaleString()} sq ft building has ~{Math.round(estimatedRoofAvailable).toLocaleString()} sq ft available.
          <span className="block mt-1 text-yellow-700">
            💡 Consider ground-mount, carport solar, or reducing to {Math.round(estimatedRoofAvailable / 100)} kW.
          </span>
        </div>
      </div>
    </div>
  );
}
