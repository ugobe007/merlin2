/**
 * MERLIN ENERGY WIZARD - Guided Configuration Flow
 * 
 * This modal walks users through energy configuration step-by-step:
 * 1. Review Merlin's Recommendation
 * 2. Configure Solar/Wind
 * 3. Configure EV Chargers  
 * 4. Set BESS-to-Power Ratio
 * 5. Confirm Selections
 * 
 * Each step shows Merlin's recommendation with option to accept or customize.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Sun,
  Wind,
  Car,
  Battery,
  Zap,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';

// ============================================
// TYPES
// ============================================

interface MerlinRecommendation {
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;
  evChargersL2: number;
  evChargersDCFC: number;
  bessRatio: number;
  backupHours: number;
  peakDemandKW: number;
  rationale: string[];
}

interface MerlinWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: Partial<WizardState>) => void;
  recommendation: MerlinRecommendation;
  industryName: string;
  location: string;
  powerCoverage: number;
}

// ============================================
// STEP DEFINITIONS
// ============================================

const STEPS = [
  { id: 'review', title: "Merlin's Recommendation", icon: Sparkles },
  { id: 'solar-wind', title: 'Solar & Wind', icon: Sun },
  { id: 'ev-chargers', title: 'EV Chargers', icon: Car },
  { id: 'bess-ratio', title: 'BESS Configuration', icon: Battery },
  { id: 'confirm', title: 'Confirm & Generate', icon: Check },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function MerlinWizardModal({
  isOpen,
  onClose,
  onComplete,
  recommendation,
  industryName,
  location,
  powerCoverage,
}: MerlinWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // User's choices (start with Merlin's recommendation)
  const [config, setConfig] = useState({
    batteryKW: recommendation.batteryKW,
    batteryKWh: recommendation.batteryKWh,
    solarKW: recommendation.solarKW,
    windKW: recommendation.windKW,
    generatorKW: recommendation.generatorKW,
    evChargersL2: recommendation.evChargersL2,
    evChargersDCFC: recommendation.evChargersDCFC,
    bessRatio: recommendation.bessRatio,
    wantsSolar: recommendation.solarKW > 0,
    wantsWind: recommendation.windKW > 0,
    wantsGenerator: recommendation.generatorKW > 0,
  });
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setConfig({
        batteryKW: recommendation.batteryKW,
        batteryKWh: recommendation.batteryKWh,
        solarKW: recommendation.solarKW,
        windKW: recommendation.windKW,
        generatorKW: recommendation.generatorKW,
        evChargersL2: recommendation.evChargersL2,
        evChargersDCFC: recommendation.evChargersDCFC,
        bessRatio: recommendation.bessRatio,
        wantsSolar: recommendation.solarKW > 0,
        wantsWind: recommendation.windKW > 0,
        wantsGenerator: recommendation.generatorKW > 0,
      });
    }
  }, [isOpen, recommendation]);
  
  // Calculate coverage based on current config
  const totalConfiguredKW = config.batteryKW + config.solarKW + config.generatorKW;
  const currentCoverage = recommendation.peakDemandKW > 0 
    ? Math.round((totalConfiguredKW / recommendation.peakDemandKW) * 100)
    : 100;
  
  if (!isOpen) return null;
  
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete - pass config back
      onComplete({
        batteryKW: config.batteryKW,
        batteryKWh: config.batteryKWh,
        solarKW: config.solarKW,
        windTurbineKW: config.windKW,
        generatorKW: config.generatorKW,
        evChargersL2: config.evChargersL2,
        evChargersDCFC: config.evChargersDCFC,
        wantsSolar: config.wantsSolar,
        wantsWind: config.wantsWind,
        wantsGenerator: config.wantsGenerator,
      });
      onClose();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleAcceptRecommendation = () => {
    setConfig({
      ...config,
      batteryKW: recommendation.batteryKW,
      batteryKWh: recommendation.batteryKWh,
      solarKW: recommendation.solarKW,
      windKW: recommendation.windKW,
      generatorKW: recommendation.generatorKW,
      wantsSolar: recommendation.solarKW > 0,
      wantsWind: recommendation.windKW > 0,
      wantsGenerator: recommendation.generatorKW > 0,
    });
    // Skip to confirm step
    setCurrentStep(STEPS.length - 1);
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Merlin Energy Wizard</h2>
                <p className="text-purple-200 text-sm">{industryName} • {location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive ? 'bg-white text-purple-600' : 
                    isComplete ? 'bg-purple-500 text-white' : 
                    'bg-purple-700/50 text-purple-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={`w-4 h-4 ${isComplete ? 'text-white' : 'text-purple-400'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Power Coverage Status Bar */}
        <div className={`px-6 py-3 flex items-center justify-between ${
          currentCoverage >= 100 ? 'bg-emerald-50' : currentCoverage >= 70 ? 'bg-amber-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${
              currentCoverage >= 100 ? 'text-emerald-600' : currentCoverage >= 70 ? 'text-amber-600' : 'text-red-600'
            }`} />
            <span className={`font-medium ${
              currentCoverage >= 100 ? 'text-emerald-700' : currentCoverage >= 70 ? 'text-amber-700' : 'text-red-700'
            }`}>
              Power Coverage: {currentCoverage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {totalConfiguredKW.toLocaleString()} kW configured / {recommendation.peakDemandKW.toLocaleString()} kW needed
            </span>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 0 && (
            <StepReview
              recommendation={recommendation}
              industryName={industryName}
              onAccept={handleAcceptRecommendation}
            />
          )}
          
          {currentStep === 1 && (
            <StepSolarWind
              config={config}
              setConfig={setConfig}
              recommendation={recommendation}
            />
          )}
          
          {currentStep === 2 && (
            <StepEVChargers
              config={config}
              setConfig={setConfig}
              recommendation={recommendation}
            />
          )}
          
          {currentStep === 3 && (
            <StepBESSRatio
              config={config}
              setConfig={setConfig}
              recommendation={recommendation}
            />
          )}
          
          {currentStep === 4 && (
            <StepConfirm
              config={config}
              recommendation={recommendation}
            />
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            {currentStep === STEPS.length - 1 ? 'Generate Quote' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepProps {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  recommendation: MerlinRecommendation;
}

function StepReview({ recommendation, industryName, onAccept }: { 
  recommendation: MerlinRecommendation; 
  industryName: string;
  onAccept: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Merlin's Optimal Configuration
        </h3>
        <p className="text-gray-500">
          Based on your {industryName.toLowerCase()} facility and goals, here's what we recommend:
        </p>
      </div>
      
      {/* Recommendation Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <Battery className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{recommendation.batteryKW} kW</div>
            <div className="text-sm text-gray-500">Battery Power</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{recommendation.batteryKWh} kWh</div>
            <div className="text-sm text-gray-500">Storage Capacity</div>
          </div>
          {recommendation.solarKW > 0 && (
            <div className="bg-white rounded-xl p-4 text-center">
              <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{recommendation.solarKW} kW</div>
              <div className="text-sm text-gray-500">Solar</div>
            </div>
          )}
          {recommendation.generatorKW > 0 && (
            <div className="bg-white rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{recommendation.generatorKW} kW</div>
              <div className="text-sm text-gray-500">Backup Generator</div>
            </div>
          )}
        </div>
        
        {/* Rationale */}
        <div className="bg-white/70 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-500" />
            Why this configuration?
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {recommendation.rationale.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onAccept}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Accept Recommendation
        </button>
        <button
          className="flex-1 py-4 bg-white border-2 border-purple-300 text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Customize My System
        </button>
      </div>
    </div>
  );
}

function StepSolarWind({ config, setConfig, recommendation }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Configure Renewable Energy</h3>
        <p className="text-gray-500">Add solar and/or wind to reduce grid dependence and maximize savings</p>
      </div>
      
      {/* Solar Configuration */}
      <div className={`rounded-2xl p-5 border-2 transition-all ${
        config.wantsSolar 
          ? 'bg-amber-50 border-amber-300' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <label className="flex items-center gap-4 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.wantsSolar}
            onChange={(e) => setConfig((prev: any) => ({ 
              ...prev, 
              wantsSolar: e.target.checked,
              solarKW: e.target.checked ? recommendation.solarKW : 0
            }))}
            className="w-6 h-6 rounded accent-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-gray-800">Add Solar Panels</span>
            </div>
            <p className="text-sm text-gray-500">Generate your own power during daylight hours</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Merlin recommends</div>
            <div className="text-amber-600 font-bold">{recommendation.solarKW} kW</div>
          </div>
        </label>
        
        {config.wantsSolar && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Solar Capacity (kW)</label>
            <input
              type="range"
              min="0"
              max={recommendation.solarKW * 2}
              value={config.solarKW}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, solarKW: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0 kW</span>
              <span className="font-bold text-amber-600">{config.solarKW} kW</span>
              <span>{recommendation.solarKW * 2} kW</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Wind Configuration */}
      <div className={`rounded-2xl p-5 border-2 transition-all ${
        config.wantsWind 
          ? 'bg-sky-50 border-sky-300' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <label className="flex items-center gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={config.wantsWind}
            onChange={(e) => setConfig((prev: any) => ({ 
              ...prev, 
              wantsWind: e.target.checked,
              windKW: e.target.checked ? recommendation.windKW : 0
            }))}
            className="w-6 h-6 rounded accent-sky-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-sky-500" />
              <span className="font-bold text-gray-800">Add Wind Turbines</span>
            </div>
            <p className="text-sm text-gray-500">Generate power 24/7 in windy locations</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Merlin recommends</div>
            <div className="text-sky-600 font-bold">{recommendation.windKW} kW</div>
          </div>
        </label>
        
        {config.wantsWind && (
          <div className="mt-4 pt-4 border-t border-sky-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Wind Capacity (kW)</label>
            <input
              type="range"
              min="0"
              max={Math.max(500, recommendation.windKW * 2)}
              value={config.windKW}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, windKW: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0 kW</span>
              <span className="font-bold text-sky-600">{config.windKW} kW</span>
              <span>{Math.max(500, recommendation.windKW * 2)} kW</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepEVChargers({ config, setConfig, recommendation }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">EV Charger Configuration</h3>
        <p className="text-gray-500">Add EV charging capability to your facility</p>
      </div>
      
      {/* Level 2 Chargers */}
      <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-800">Level 2 Chargers</span>
            </div>
            <p className="text-sm text-gray-500">7-11 kW each • 4-8 hour charging</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Merlin recommends</div>
            <div className="text-blue-600 font-bold">{recommendation.evChargersL2} chargers</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setConfig((prev: any) => ({ ...prev, evChargersL2: Math.max(0, prev.evChargersL2 - 1) }))}
            className="w-12 h-12 bg-white rounded-xl font-bold text-2xl hover:bg-gray-100"
          >−</button>
          <div className="flex-1 text-center">
            <div className="text-4xl font-bold text-blue-600">{config.evChargersL2}</div>
            <div className="text-sm text-gray-500">{config.evChargersL2 * 11} kW total</div>
          </div>
          <button
            onClick={() => setConfig((prev: any) => ({ ...prev, evChargersL2: prev.evChargersL2 + 1 }))}
            className="w-12 h-12 bg-blue-100 rounded-xl font-bold text-2xl hover:bg-blue-200"
          >+</button>
        </div>
      </div>
      
      {/* DCFC Chargers */}
      <div className="bg-purple-50 rounded-2xl p-5 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-gray-800">DC Fast Chargers (DCFC)</span>
            </div>
            <p className="text-sm text-gray-500">50-150 kW each • 20-45 min charging</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Merlin recommends</div>
            <div className="text-purple-600 font-bold">{recommendation.evChargersDCFC} chargers</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setConfig((prev: any) => ({ ...prev, evChargersDCFC: Math.max(0, prev.evChargersDCFC - 1) }))}
            className="w-12 h-12 bg-white rounded-xl font-bold text-2xl hover:bg-gray-100"
          >−</button>
          <div className="flex-1 text-center">
            <div className="text-4xl font-bold text-purple-600">{config.evChargersDCFC}</div>
            <div className="text-sm text-gray-500">{config.evChargersDCFC * 100} kW total</div>
          </div>
          <button
            onClick={() => setConfig((prev: any) => ({ ...prev, evChargersDCFC: prev.evChargersDCFC + 1 }))}
            className="w-12 h-12 bg-purple-100 rounded-xl font-bold text-2xl hover:bg-purple-200"
          >+</button>
        </div>
      </div>
      
      {/* Total EV Load */}
      <div className="bg-gray-100 rounded-xl p-4 text-center">
        <div className="text-sm text-gray-500">Total EV Charging Load</div>
        <div className="text-2xl font-bold text-gray-800">
          {(config.evChargersL2 * 11) + (config.evChargersDCFC * 100)} kW
        </div>
      </div>
    </div>
  );
}

function StepBESSRatio({ config, setConfig, recommendation }: StepProps) {
  const bessRatioOptions = [
    { ratio: 0.40, label: 'Peak Shaving', desc: 'Shave top 40% of demand peaks', color: 'amber' },
    { ratio: 0.50, label: 'Balanced', desc: 'Peak shaving + TOU arbitrage', color: 'blue' },
    { ratio: 0.70, label: 'Resilience', desc: 'Cover 70% for critical backup', color: 'purple' },
    { ratio: 1.00, label: 'Full Coverage', desc: '100% peak demand capability', color: 'emerald' },
  ];
  
  // Calculate battery size based on ratio
  const calculatedBatteryKW = Math.round(recommendation.peakDemandKW * config.bessRatio);
  const calculatedBatteryKWh = Math.round(calculatedBatteryKW * recommendation.backupHours);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">BESS-to-Power Ratio</h3>
        <p className="text-gray-500">How much of your peak demand should the battery cover?</p>
      </div>
      
      {/* Current Selection Display */}
      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 text-center border-2 border-purple-300">
        <div className="text-sm text-purple-600 font-medium mb-1">Your BESS Configuration</div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-4xl font-black text-purple-700">{calculatedBatteryKW}</div>
            <div className="text-sm text-purple-500">kW Power</div>
          </div>
          <div className="text-3xl text-purple-300">×</div>
          <div>
            <div className="text-4xl font-black text-purple-700">{recommendation.backupHours}h</div>
            <div className="text-sm text-purple-500">Duration</div>
          </div>
          <div className="text-3xl text-purple-300">=</div>
          <div>
            <div className="text-4xl font-black text-purple-700">{calculatedBatteryKWh}</div>
            <div className="text-sm text-purple-500">kWh Capacity</div>
          </div>
        </div>
      </div>
      
      {/* Ratio Selection */}
      <div className="grid grid-cols-2 gap-3">
        {bessRatioOptions.map((option) => {
          const isSelected = config.bessRatio === option.ratio;
          const isRecommended = recommendation.bessRatio === option.ratio;
          
          return (
            <button
              key={option.ratio}
              onClick={() => setConfig((prev: any) => ({ 
                ...prev, 
                bessRatio: option.ratio,
                batteryKW: Math.round(recommendation.peakDemandKW * option.ratio),
                batteryKWh: Math.round(recommendation.peakDemandKW * option.ratio * recommendation.backupHours),
              }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                  {option.label}
                </span>
                <span className={`text-lg font-black ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
                  {Math.round(option.ratio * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">{option.desc}</p>
              {isRecommended && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Custom Slider */}
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fine-tune ratio: {Math.round(config.bessRatio * 100)}%
        </label>
        <input
          type="range"
          min="20"
          max="150"
          value={Math.round(config.bessRatio * 100)}
          onChange={(e) => {
            const ratio = parseInt(e.target.value) / 100;
            setConfig((prev: any) => ({ 
              ...prev, 
              bessRatio: ratio,
              batteryKW: Math.round(recommendation.peakDemandKW * ratio),
              batteryKWh: Math.round(recommendation.peakDemandKW * ratio * recommendation.backupHours),
            }));
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>20% (Min)</span>
          <span>100% (Full)</span>
          <span>150% (Over)</span>
        </div>
      </div>
    </div>
  );
}

function StepConfirm({ config, recommendation }: { config: any; recommendation: MerlinRecommendation }) {
  const totalConfiguredKW = config.batteryKW + config.solarKW + config.generatorKW;
  const coverage = recommendation.peakDemandKW > 0 
    ? Math.round((totalConfiguredKW / recommendation.peakDemandKW) * 100)
    : 100;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          coverage >= 100 ? 'bg-emerald-100' : 'bg-amber-100'
        }`}>
          {coverage >= 100 ? (
            <Check className="w-8 h-8 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-800">Confirm Your Configuration</h3>
        <p className="text-gray-500">Review your selections before generating your quote</p>
      </div>
      
      {/* Coverage Status */}
      <div className={`rounded-2xl p-4 text-center ${
        coverage >= 100 ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'
      }`}>
        <div className={`text-4xl font-black ${coverage >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {coverage}%
        </div>
        <div className={`text-sm font-medium ${coverage >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
          {coverage >= 100 ? '✓ Power needs covered!' : '⚠ Power gap detected'}
        </div>
      </div>
      
      {/* Configuration Summary */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-gray-700 mb-3">Your System Configuration</h4>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-purple-500" />
            <span className="text-gray-700">Battery Storage</span>
          </div>
          <span className="font-bold text-gray-800">{config.batteryKW} kW / {config.batteryKWh} kWh</span>
        </div>
        
        {config.wantsSolar && config.solarKW > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-gray-700">Solar Panels</span>
            </div>
            <span className="font-bold text-gray-800">{config.solarKW} kW</span>
          </div>
        )}
        
        {config.wantsWind && config.windKW > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-sky-500" />
              <span className="text-gray-700">Wind Turbines</span>
            </div>
            <span className="font-bold text-gray-800">{config.windKW} kW</span>
          </div>
        )}
        
        {config.wantsGenerator && config.generatorKW > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-slate-500" />
              <span className="text-gray-700">Backup Generator</span>
            </div>
            <span className="font-bold text-gray-800">{config.generatorKW} kW</span>
          </div>
        )}
        
        {(config.evChargersL2 > 0 || config.evChargersDCFC > 0) && (
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">EV Chargers</span>
            </div>
            <span className="font-bold text-gray-800">
              {config.evChargersL2 > 0 ? `${config.evChargersL2} L2` : ''}
              {config.evChargersL2 > 0 && config.evChargersDCFC > 0 ? ' + ' : ''}
              {config.evChargersDCFC > 0 ? `${config.evChargersDCFC} DCFC` : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Ready Message */}
      <div className="text-center py-4">
        <p className="text-gray-600">
          Click <strong>"Generate Quote"</strong> to see your detailed pricing and savings analysis.
        </p>
      </div>
    </div>
  );
}

export default MerlinWizardModal;
