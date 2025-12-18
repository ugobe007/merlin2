/**
 * GOALS SECTION V2 - Refactored December 17, 2025
 * ================================================
 * 
 * Refactored to use high-fidelity UI components:
 * - StepExplanation for header
 * - QuestionCard for question containers
 * - YesNoButtons for binary choices
 * - SliderInput for numeric ranges
 * - SegmentedControl for multi-option selections
 * - PrimaryButton/SecondaryButton for actions
 * 
 * This replaces the low-fidelity checkboxes and basic buttons.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Car, Sun, Wind, Fuel, Zap, Info, Home } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';

// Import new high-fidelity UI components
import {
  StepExplanation,
  QuestionCard,
  YesNoButtons,
  SliderInput,
  SegmentedControl,
  PrimaryButton,
  SecondaryButton,
  DropdownSelector,
} from '../ui';

// Constants for sizing calculations
import { 
  GENERATOR_RESERVE_MARGIN,
  getCriticalLoadPercentage,
} from '../constants/wizardConstants';

// ============================================================================
// TYPES
// ============================================================================

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

interface GoalsSectionV2Props {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onHome?: () => void; // Navigate to vertical landing page
  onGenerateScenarios?: () => void;
  isGeneratingScenarios?: boolean;
  powerCoverage?: number;
  peakDemandKW?: number;
  merlinRecommendation?: MerlinRecommendation;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GoalsSectionV2({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  onHome,
  onGenerateScenarios,
  isGeneratingScenarios = false,
  powerCoverage = 100,
  peakDemandKW = 500,
  merlinRecommendation,
}: GoalsSectionV2Props) {
  const isEVChargingUseCase = wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging';
  const needsMorePower = powerCoverage < 100;
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // Calculate recommended values from SSOT or use defaults
  const defaultRecommendation = useMemo(() => {
    if (merlinRecommendation) return merlinRecommendation;
    
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
    const batteryKW = Math.round(totalPeakDemand * 0.4);
    const batteryKWh = batteryKW * 4;
    
    return {
      solarKW: Math.round(totalPeakDemand * 0.6),
      windKW: 0,
      generatorKW: Math.round(totalPeakDemand * 0.25),
      batteryKW,
      batteryKWh,
      durationHours: 4,
      pcsKW: batteryKW,
      transformerKVA: Math.round(totalPeakDemand * 0.5),
      totalProductionKW: Math.round(totalPeakDemand * 0.85),
      totalStorageKWh: batteryKWh,
      dailyProductionKWh: Math.round(totalPeakDemand * 0.6 * 4.5),
      annualSavings: 0,
      paybackYears: 0,
      roi10Year: 0,
      currency: 'USD',
    };
  }, [peakDemandKW, merlinRecommendation, wizardState.existingEVL1, wizardState.existingEVL2, wizardState.existingEVL3, wizardState.evChargersL1, wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC]);

  const recommendationRef = useRef(defaultRecommendation);
  
  useEffect(() => {
    recommendationRef.current = defaultRecommendation;
  }, [defaultRecommendation]);

  // Auto-populate on first load
  useEffect(() => {
    if (currentSection === 3 && !hasAutoPopulated) {
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
  }, [currentSection, hasAutoPopulated, setWizardState]);

  // Format helpers
  const formatKW = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;

  // Calculate total EV load
  const totalEVLoadKW = useMemo(() => {
    return (
      (wizardState.existingEVL1 * 1.4) +
      (wizardState.existingEVL2 * 11) +
      (wizardState.existingEVL3 * 100) +
      (wizardState.evChargersL2 * 11) +
      (wizardState.evChargersDCFC * 150) +
      (wizardState.evChargersHPC * 350)
    );
  }, [wizardState.existingEVL1, wizardState.existingEVL2, wizardState.existingEVL3, wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC]);

  // Get generator recommendation based on industry
  const getRecommendedGeneratorKW = useCallback(() => {
    const criticalLoadPct = getCriticalLoadPercentage(wizardState.selectedIndustry || 'default');
    const criticalLoadKW = peakDemandKW * criticalLoadPct;
    return Math.round(criticalLoadKW * GENERATOR_RESERVE_MARGIN);
  }, [peakDemandKW, wizardState.selectedIndustry]);

  if (currentSection !== 3) return null;

  return (
    <div
      ref={sectionRef}
      className="min-h-[calc(100vh-120px)] p-8"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ════════════════════════════════════════════════════════════════
            STEP EXPLANATION HEADER
            ════════════════════════════════════════════════════════════════ */}
        <StepExplanation
          stepNumber={3}
          totalSteps={5}
          title="Configure Your Energy System"
          description="Tell us what equipment you have and what you want to add. Merlin will optimize your battery storage quote based on these preferences."
          estimatedTime="3 minutes"
        />

        {/* Merlin Recommendation Summary */}
        {defaultRecommendation.annualSavings > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/50 rounded-2xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white">Merlin's Recommendation</h4>
                <p className="text-purple-200 text-sm mt-1">
                  Based on your {wizardState.industryName || 'facility'}, we recommend {formatKW(defaultRecommendation.batteryKW)} battery 
                  {defaultRecommendation.solarKW > 0 && ` + ${formatKW(defaultRecommendation.solarKW)} solar`}.
                  Estimated savings: <strong className="text-emerald-400">${defaultRecommendation.annualSavings.toLocaleString()}/year</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: EXISTING EV CHARGERS
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-gray-900">Existing EV Chargers</h3>
          </div>
          
          <YesNoButtons
            label="Do you have existing EV chargers at your facility?"
            helpText="If yes, we'll factor their power usage into your energy analysis."
            value={wizardState.hasExistingEV}
            onChange={(value) => setWizardState(prev => ({
              ...prev,
              hasExistingEV: value,
              ...(value ? {} : { existingEVL1: 0, existingEVL2: 0, existingEVL3: 0 })
            }))}
          />

          {wizardState.hasExistingEV && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <SliderInput
                label="Level 1 Chargers (1.4 kW each)"
                helpText="Standard 120V outlets - typically for employee parking"
                min={0}
                max={20}
                step={1}
                value={wizardState.existingEVL1}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
                unit="units"
              />
              
              <SliderInput
                label="Level 2 Chargers (7-19 kW each)"
                helpText="240V chargers - most common for commercial installations"
                min={0}
                max={50}
                step={1}
                value={wizardState.existingEVL2}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
                unit="units"
              />
              
              <SliderInput
                label="DCFC Chargers (50-150 kW each)"
                helpText="DC Fast Chargers - high-power charging stations"
                min={0}
                max={20}
                step={1}
                value={wizardState.existingEVL3}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
                unit="units"
              />

              {totalEVLoadKW > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-700">
                    <strong>Total EV Load:</strong> {formatKW(totalEVLoadKW)}
                  </p>
                </div>
              )}
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: NEW EV CHARGERS
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Add New EV Chargers</h3>
          </div>
          
          <YesNoButtons
            label={isEVChargingUseCase ? "Would you like to expand your charging capacity?" : "Would you like to add EV chargers?"}
            helpText="Plan for future EV infrastructure - we'll size your battery to support these."
            value={wizardState.wantsEVCharging}
            onChange={(value) => setWizardState(prev => ({
              ...prev,
              wantsEVCharging: value,
              ...(value ? {} : { evChargersL2: 0, evChargersDCFC: 0, evChargersHPC: 0 })
            }))}
          />

          {wizardState.wantsEVCharging && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <SliderInput
                label="Level 2 Chargers (7-19 kW each)"
                min={0}
                max={50}
                step={1}
                value={wizardState.evChargersL2}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersL2: v }))}
                unit="units"
              />
              
              <SliderInput
                label="DCFC Chargers (50-150 kW each)"
                min={0}
                max={20}
                step={1}
                value={wizardState.evChargersDCFC}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersDCFC: v }))}
                unit="units"
              />
              
              <SliderInput
                label="HPC Chargers (250-350 kW each)"
                helpText="High Power Chargers for ultra-fast charging"
                min={0}
                max={10}
                step={1}
                value={wizardState.evChargersHPC}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersHPC: v }))}
                unit="units"
              />
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: SOLAR
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Solar Power</h3>
            {needsMorePower && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                RECOMMENDED
              </span>
            )}
          </div>
          
          <YesNoButtons
            label="Would you like to add solar panels?"
            helpText="Solar can significantly reduce your electricity costs and pairs well with battery storage."
            value={wizardState.wantsSolar}
            onChange={(value) => {
              console.log('[Solar YesNo] onChange triggered with value:', value, 'current wantsSolar:', wizardState.wantsSolar);
              const recommendedSolar = Math.round(peakDemandKW * 0.6);
              setWizardState(prev => {
                console.log('[Solar YesNo] Setting new state, prev.wantsSolar:', prev.wantsSolar, '→ new:', value);
                return {
                  ...prev,
                  wantsSolar: value,
                  solarKW: value ? (prev.solarKW || recommendedSolar) : 0
                };
              });
            }}
          />

          {wizardState.wantsSolar && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <SliderInput
                label="Solar System Size"
                helpText={`Merlin recommends ${formatKW(Math.round(peakDemandKW * 0.6))} for your facility.`}
                min={0}
                max={Math.max(2000, Math.round(peakDemandKW * 1.5))}
                step={25}
                value={wizardState.solarKW}
                onChange={(v) => setWizardState(prev => ({ ...prev, solarKW: v }))}
                unit="kW"
              />

              {/* Solar Canopy Option */}
              <YesNoButtons
                label="Include solar parking canopy?"
                helpText="Provides shade for parking while generating power - premium option."
                value={wizardState.wantsSolarCanopy || false}
                onChange={(value) => setWizardState(prev => ({ ...prev, wantsSolarCanopy: value }))}
              />
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: WIND (Optional)
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-sky-500" />
            <h3 className="text-lg font-semibold text-gray-900">Wind Power</h3>
            <span className="text-xs text-gray-400">(Optional)</span>
          </div>
          
          <YesNoButtons
            label="Would you like to add wind turbines?"
            helpText="Wind power complements solar by generating electricity at night and in cloudy conditions."
            value={wizardState.wantsWind}
            onChange={(value) => setWizardState(prev => ({
              ...prev,
              wantsWind: value,
              windTurbineKW: value ? (prev.windTurbineKW || Math.round(peakDemandKW * 0.2)) : 0
            }))}
          />

          {wizardState.wantsWind && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <SliderInput
                label="Wind Turbine Capacity"
                min={0}
                max={Math.max(500, Math.round(peakDemandKW * 0.5))}
                step={10}
                value={wizardState.windTurbineKW}
                onChange={(v) => setWizardState(prev => ({ ...prev, windTurbineKW: v }))}
                unit="kW"
              />
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: BACKUP GENERATOR
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Fuel className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-gray-900">Backup Generator</h3>
            {needsMorePower && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                RECOMMENDED
              </span>
            )}
          </div>
          
          <YesNoButtons
            label="Would you like to add a backup generator?"
            helpText="Provides extended backup beyond battery duration for critical operations."
            value={wizardState.wantsGenerator}
            onChange={(value) => {
              const recommendedKW = getRecommendedGeneratorKW();
              setWizardState(prev => ({
                ...prev,
                wantsGenerator: value,
                generatorKW: value ? (prev.generatorKW || recommendedKW) : 0
              }));
            }}
          />

          {wizardState.wantsGenerator && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              {/* Generator Type */}
              <SegmentedControl
                label="Generator Type"
                helpText="Traditional engines or modern linear generators."
                options={[
                  { value: 'traditional', label: '⚙️ Traditional' },
                  { value: 'linear', label: '🔋 Linear Generator' },
                ]}
                value={wizardState.generatorType || 'traditional'}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorType: v as any }))}
              />

              {/* Fuel Type */}
              <DropdownSelector
                label="Fuel Type"
                options={[
                  { value: 'natural-gas', label: 'Natural Gas', icon: '🔥' },
                  { value: 'diesel', label: 'Diesel', icon: '⛽' },
                  { value: 'propane', label: 'Propane', icon: '🛢️' },
                ]}
                value={wizardState.generatorFuel}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorFuel: v as any }))}
              />

              <SliderInput
                label="Generator Size"
                helpText={`Merlin recommends ${formatKW(getRecommendedGeneratorKW())} based on your critical load.`}
                min={50}
                max={20000}
                step={50}
                value={wizardState.generatorKW}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorKW: v }))}
                unit="kW"
              />
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6: GRID CONNECTION
            ════════════════════════════════════════════════════════════════ */}
        <QuestionCard>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900">Grid Connection Status</h3>
          </div>
          
          <SegmentedControl
            label="What is your current grid connection status?"
            helpText="This affects backup requirements and system sizing."
            options={[
              { value: 'on-grid', label: '🔌 On-Grid' },
              { value: 'limited', label: '⚠️ Limited' },
              { value: 'unreliable', label: '🔴 Unreliable' },
              { value: 'off-grid', label: '🏝️ Off-Grid' },
            ]}
            value={wizardState.gridConnection || 'on-grid'}
            onChange={(v) => setWizardState(prev => ({ ...prev, gridConnection: v as any }))}
          />

          {(wizardState.gridConnection === 'limited' || wizardState.gridConnection === 'unreliable') && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Based on your grid status, we recommend a larger battery system with backup generator 
                  to ensure reliable power during outages.
                </p>
              </div>
            </div>
          )}
        </QuestionCard>

        {/* ════════════════════════════════════════════════════════════════
            NAVIGATION - Back / Home / Next Step (Dec 17, 2025 Spec)
            ════════════════════════════════════════════════════════════════ */}
        <div className="mt-8 pt-6 border-t border-white/10">
          {/* Primary: Generate Scenarios - Now integrated into Next Step */}
          
          {/* Navigation buttons - Back / Home / Next Step */}
          <div className="flex items-center justify-between">
            {/* Left side - Back and Home */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              
              <button
                onClick={onHome || onBack} // Home navigates to vertical landing page
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-xl border border-slate-600 transition-all"
              >
                <Home className="w-5 h-5" />
                Home
              </button>
            </div>
            
            {/* Right side - Next Step (generates scenarios and advances) */}
            <button
              onClick={() => {
                // Generate scenarios if available, then continue
                if (onGenerateScenarios) {
                  onGenerateScenarios();
                }
                onContinue();
              }}
              disabled={isGeneratingScenarios}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isGeneratingScenarios ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalsSectionV2;
