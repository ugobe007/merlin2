/**
 * DataCenterQuestionnaire Component
 * 
 * Specialized questionnaire for data center BESS sizing.
 * 10 core questions with optional expanded details.
 */

import React, { useState, useCallback } from 'react';
import {
  X,
  Server,
  Cpu,
  Zap,
  Battery,
  Thermometer,
  Clock,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Check
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DataCenterConfig {
  facilityTier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  totalSquareFeet: number;
  rackCount: number;
  avgPowerPerRack: number;
  currentITLoadMW: number;
  cpuCount: number;
  gpuCount: number;
  workloadType: 'general' | 'ai-ml' | 'hpc' | 'cloud' | 'enterprise' | 'colocation';
  expectedGrowthPercent: number;
  currentPUE: number;
  targetPUE: number;
  coolingType: 'air' | 'liquid' | 'hybrid' | 'immersion';
  uptimeRequirement: '99.9' | '99.99' | '99.999' | '99.9999';
  backupDurationHours: number;
  renewableTargetPercent: number;
  gridReliability: 'reliable' | 'moderate' | 'unreliable' | 'none';
  extendedData?: {
    cue?: number;
    wue?: number;
    redundancyLevel?: 'n' | 'n+1' | '2n' | '2n+1';
  };
}

interface DataCenterQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: DataCenterConfig) => void;
  initialConfig?: Partial<DataCenterConfig>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_OPTIONS = [
  { id: 'tier1', label: 'Tier I', uptime: '99.671%', description: 'Basic, no redundancy' },
  { id: 'tier2', label: 'Tier II', uptime: '99.741%', description: 'Redundant components' },
  { id: 'tier3', label: 'Tier III', uptime: '99.982%', description: 'Concurrently maintainable' },
  { id: 'tier4', label: 'Tier IV', uptime: '99.995%', description: 'Fault tolerant' }
];

const WORKLOAD_OPTIONS = [
  { id: 'general', label: 'General Purpose', powerDensity: 5, icon: '🖥️' },
  { id: 'enterprise', label: 'Enterprise IT', powerDensity: 8, icon: '🏢' },
  { id: 'cloud', label: 'Cloud/Hyperscale', powerDensity: 12, icon: '☁️' },
  { id: 'ai-ml', label: 'AI/ML Training', powerDensity: 30, icon: '🤖' },
  { id: 'hpc', label: 'HPC/Scientific', powerDensity: 25, icon: '🔬' },
  { id: 'colocation', label: 'Colocation', powerDensity: 10, icon: '🔗' }
];

const UPTIME_OPTIONS = [
  { id: '99.9', label: '99.9% (Three Nines)', downtime: '8.76 hrs/year' },
  { id: '99.99', label: '99.99% (Four Nines)', downtime: '52.6 min/year' },
  { id: '99.999', label: '99.999% (Five Nines)', downtime: '5.26 min/year' },
  { id: '99.9999', label: '99.9999% (Six Nines)', downtime: '31.5 sec/year' }
];

const COOLING_OPTIONS = [
  { id: 'air', label: 'Air Cooled', icon: '💨' },
  { id: 'liquid', label: 'Liquid Cooled', icon: '💧' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { id: 'immersion', label: 'Immersion', icon: '🛁' }
];

const GRID_OPTIONS = [
  { id: 'reliable', label: 'Reliable Grid', description: '<2 outages/year' },
  { id: 'moderate', label: 'Moderate', description: '2-12 outages/year' },
  { id: 'unreliable', label: 'Unreliable', description: '>12 outages/year' },
  { id: 'none', label: 'Off-Grid', description: 'Island mode required' }
];

// ============================================================================
// COMPONENT
// ============================================================================

export const DataCenterQuestionnaire: React.FC<DataCenterQuestionnaireProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialConfig
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [config, setConfig] = useState<DataCenterConfig>({
    facilityTier: initialConfig?.facilityTier || 'tier3',
    totalSquareFeet: initialConfig?.totalSquareFeet || 50000,
    rackCount: initialConfig?.rackCount || 500,
    avgPowerPerRack: initialConfig?.avgPowerPerRack || 10,
    currentITLoadMW: initialConfig?.currentITLoadMW || 5,
    cpuCount: initialConfig?.cpuCount || 10000,
    gpuCount: initialConfig?.gpuCount || 0,
    workloadType: initialConfig?.workloadType || 'enterprise',
    expectedGrowthPercent: initialConfig?.expectedGrowthPercent || 15,
    currentPUE: initialConfig?.currentPUE || 1.5,
    targetPUE: initialConfig?.targetPUE || 1.3,
    coolingType: initialConfig?.coolingType || 'hybrid',
    uptimeRequirement: initialConfig?.uptimeRequirement || '99.99',
    backupDurationHours: initialConfig?.backupDurationHours || 4,
    renewableTargetPercent: initialConfig?.renewableTargetPercent || 50,
    gridReliability: initialConfig?.gridReliability || 'reliable',
    extendedData: initialConfig?.extendedData || {}
  });

  const updateConfig = useCallback(<K extends keyof DataCenterConfig>(key: K, value: DataCenterConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Calculated values
  const calculatedITLoad = config.rackCount * config.avgPowerPerRack / 1000;
  const calculatedTotalPower = calculatedITLoad * config.currentPUE;
  const recommendedBackup = config.uptimeRequirement === '99.9999' ? 8 :
                           config.uptimeRequirement === '99.999' ? 6 :
                           config.uptimeRequirement === '99.99' ? 4 : 2;

  const handleComplete = useCallback(() => {
    const finalConfig = {
      ...config,
      currentITLoadMW: config.currentITLoadMW || calculatedITLoad
    };
    onComplete(finalConfig);
    onClose();
  }, [config, calculatedITLoad, onComplete, onClose]);

  if (!isOpen) return null;

  // Questions array
  const questions = [
    // Q1: Facility Tier
    {
      title: 'Data Center Tier',
      subtitle: 'What tier classification best describes your facility?',
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {TIER_OPTIONS.map(tier => (
            <button
              key={tier.id}
              onClick={() => updateConfig('facilityTier', tier.id as DataCenterConfig['facilityTier'])}
              className={`p-4 rounded-xl text-left transition-all ${
                config.facilityTier === tier.id
                  ? 'bg-purple-600 text-white border-2 border-purple-400'
                  : 'bg-purple-900/40 text-gray-300 border-2 border-purple-700/50 hover:border-purple-500'
              }`}
            >
              <div className="font-bold">{tier.label}</div>
              <div className="text-sm opacity-80">{tier.uptime}</div>
              <div className="text-xs opacity-60 mt-1">{tier.description}</div>
            </button>
          ))}
        </div>
      )
    },

    // Q2: Facility Size
    {
      title: 'Facility Size',
      subtitle: 'Total white space and rack capacity',
      icon: <Server className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Total Square Feet</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5000}
                max={5000000}
                step={5000}
                value={config.totalSquareFeet}
                onChange={(e) => updateConfig('totalSquareFeet', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-white w-32 text-right">
                {config.totalSquareFeet >= 1000000 
                  ? `${(config.totalSquareFeet / 1000000).toFixed(1)}M`
                  : `${(config.totalSquareFeet / 1000).toFixed(0)}K`} sf
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Number of Racks</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={100000}
                step={10}
                value={config.rackCount}
                onChange={(e) => updateConfig('rackCount', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-white w-24 text-right">
                {config.rackCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Avg Power per Rack (kW)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={2}
                max={100}
                step={1}
                value={config.avgPowerPerRack}
                onChange={(e) => updateConfig('avgPowerPerRack', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-white w-20 text-right">
                {config.avgPowerPerRack} kW
              </span>
            </div>
          </div>

          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="text-sm text-gray-400">Calculated IT Load</div>
            <div className="text-2xl font-bold text-purple-400">
              {calculatedITLoad.toFixed(1)} MW
            </div>
          </div>
        </div>
      )
    },

    // Q3: Workload Type
    {
      title: 'Workload Profile',
      subtitle: 'Primary workload type and compute resources',
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {WORKLOAD_OPTIONS.map(workload => (
              <button
                key={workload.id}
                onClick={() => updateConfig('workloadType', workload.id as DataCenterConfig['workloadType'])}
                className={`p-3 rounded-xl text-center transition-all ${
                  config.workloadType === workload.id
                    ? 'bg-purple-600 text-white border-2 border-purple-400'
                    : 'bg-purple-900/40 text-gray-300 border-2 border-purple-700/50 hover:border-purple-500'
                }`}
              >
                <div className="text-2xl mb-1">{workload.icon}</div>
                <div className="text-sm font-medium">{workload.label}</div>
                <div className="text-xs opacity-60">{workload.powerDensity} kW/rack</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">CPU Count</label>
              <input
                type="number"
                value={config.cpuCount}
                onChange={(e) => updateConfig('cpuCount', Number(e.target.value))}
                className="w-full px-4 py-3 bg-purple-900/40 border border-purple-700/50 rounded-lg text-white"
                placeholder="e.g., 10000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">GPU Count</label>
              <input
                type="number"
                value={config.gpuCount}
                onChange={(e) => updateConfig('gpuCount', Number(e.target.value))}
                className="w-full px-4 py-3 bg-purple-900/40 border border-purple-700/50 rounded-lg text-white"
                placeholder="e.g., 5000"
              />
            </div>
          </div>

          {config.gpuCount > 0 && (
            <div className="p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Info className="w-4 h-4" />
                <span>AI/GPU workloads typically require 3-5x more power density</span>
              </div>
            </div>
          )}
        </div>
      )
    },

    // Q4: Growth
    {
      title: 'Growth Planning',
      subtitle: 'Expected capacity growth over the next 3-5 years',
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Annual Growth Rate</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.expectedGrowthPercent}
                onChange={(e) => updateConfig('expectedGrowthPercent', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-white w-20 text-right">
                {config.expectedGrowthPercent}%
              </span>
            </div>
          </div>

          <div className="p-4 bg-purple-900/40 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Projected IT Load (3 years)</div>
            <div className="text-2xl font-bold text-green-400">
              {(calculatedITLoad * Math.pow(1 + config.expectedGrowthPercent / 100, 3)).toFixed(1)} MW
            </div>
            <div className="text-sm text-gray-500 mt-1">
              vs. current {calculatedITLoad.toFixed(1)} MW
            </div>
          </div>
        </div>
      )
    },

    // Q5: PUE
    {
      title: 'Efficiency Metrics',
      subtitle: 'Power Usage Effectiveness (PUE)',
      icon: <Thermometer className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current PUE</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.05}
                value={config.currentPUE}
                onChange={(e) => updateConfig('currentPUE', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className={`text-xl font-bold w-16 text-right ${
                config.currentPUE <= 1.2 ? 'text-green-400' :
                config.currentPUE <= 1.5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {config.currentPUE.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Cooling Technology</label>
            <div className="grid grid-cols-4 gap-2">
              {COOLING_OPTIONS.map(cooling => (
                <button
                  key={cooling.id}
                  onClick={() => updateConfig('coolingType', cooling.id as DataCenterConfig['coolingType'])}
                  className={`p-3 rounded-lg text-center transition-all ${
                    config.coolingType === cooling.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-900/40 text-gray-300 hover:bg-purple-800/50'
                  }`}
                >
                  <div className="text-xl">{cooling.icon}</div>
                  <div className="text-xs mt-1">{cooling.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="text-sm text-gray-400">Total Facility Power (with PUE)</div>
            <div className="text-2xl font-bold text-purple-400">
              {calculatedTotalPower.toFixed(1)} MW
            </div>
          </div>
        </div>
      )
    },

    // Q6: Uptime
    {
      title: 'Reliability Requirements',
      subtitle: 'Required uptime and backup duration',
      icon: <Clock className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            {UPTIME_OPTIONS.map(uptime => (
              <button
                key={uptime.id}
                onClick={() => updateConfig('uptimeRequirement', uptime.id as DataCenterConfig['uptimeRequirement'])}
                className={`w-full p-4 rounded-lg flex justify-between items-center transition-all ${
                  config.uptimeRequirement === uptime.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-900/40 text-gray-300 hover:bg-purple-800/50'
                }`}
              >
                <span className="font-medium">{uptime.label}</span>
                <span className="text-sm opacity-70">{uptime.downtime}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Backup Duration (hours)
              <span className="ml-2 text-purple-400">(Recommended: {recommendedBackup}+ hrs)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0.5}
                max={24}
                step={0.5}
                value={config.backupDurationHours}
                onChange={(e) => updateConfig('backupDurationHours', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-white w-20 text-right">
                {config.backupDurationHours} hrs
              </span>
            </div>
          </div>
        </div>
      )
    },

    // Q7: Grid
    {
      title: 'Grid Connection',
      subtitle: 'Utility grid reliability',
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-4">
          {GRID_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => updateConfig('gridReliability', option.id as DataCenterConfig['gridReliability'])}
              className={`w-full p-4 rounded-lg flex justify-between items-center transition-all ${
                config.gridReliability === option.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-900/40 text-gray-300 hover:bg-purple-800/50'
              }`}
            >
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm opacity-70">{option.description}</div>
              </div>
              {config.gridReliability === option.id && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      )
    },

    // Q8: Renewables
    {
      title: 'Sustainability Goals',
      subtitle: 'Renewable energy targets',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Renewable Energy Target</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.renewableTargetPercent}
                onChange={(e) => updateConfig('renewableTargetPercent', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xl font-bold text-green-400 w-20 text-right">
                {config.renewableTargetPercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[25, 50, 100].map(pct => (
              <button
                key={pct}
                onClick={() => updateConfig('renewableTargetPercent', pct)}
                className="p-3 bg-purple-900/40 rounded-lg text-center hover:bg-purple-800/50"
              >
                <div className={`text-lg font-bold ${
                  pct === 100 ? 'text-green-400' : pct === 50 ? 'text-yellow-400' : 'text-gray-400'
                }`}>{pct}%</div>
                <div className="text-xs text-gray-500">
                  {pct === 100 ? 'Net Zero' : pct === 50 ? 'Moderate' : 'Standard'}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-purple-400 text-sm"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics (CUE, WUE)
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-purple-700/50">
              <div>
                <label className="block text-sm text-gray-400 mb-2">CUE (kg CO2/kWh)</label>
                <input
                  type="number"
                  value={config.extendedData?.cue || ''}
                  onChange={(e) => updateConfig('extendedData', {
                    ...config.extendedData,
                    cue: Number(e.target.value)
                  })}
                  className="w-full px-4 py-3 bg-purple-900/40 border border-purple-700/50 rounded-lg text-white"
                  placeholder="e.g., 0.5"
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">WUE (L/kWh)</label>
                <input
                  type="number"
                  value={config.extendedData?.wue || ''}
                  onChange={(e) => updateConfig('extendedData', {
                    ...config.extendedData,
                    wue: Number(e.target.value)
                  })}
                  className="w-full px-4 py-3 bg-purple-900/40 border border-purple-700/50 rounded-lg text-white"
                  placeholder="e.g., 1.8"
                  step={0.1}
                />
              </div>
            </div>
          )}
        </div>
      )
    },

    // Q9: Summary
    {
      title: 'Configuration Summary',
      subtitle: 'Review your data center specifications',
      icon: <Battery className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-900/40 rounded-lg">
              <div className="text-xs text-gray-500">Facility</div>
              <div className="text-lg font-bold text-white">
                {TIER_OPTIONS.find(t => t.id === config.facilityTier)?.label}
              </div>
              <div className="text-sm text-gray-400">
                {config.totalSquareFeet.toLocaleString()} sf • {config.rackCount.toLocaleString()} racks
              </div>
            </div>
            <div className="p-4 bg-purple-900/40 rounded-lg">
              <div className="text-xs text-gray-500">IT Load</div>
              <div className="text-lg font-bold text-purple-400">{calculatedITLoad.toFixed(1)} MW</div>
              <div className="text-sm text-gray-400">
                {config.cpuCount.toLocaleString()} CPUs • {config.gpuCount.toLocaleString()} GPUs
              </div>
            </div>
            <div className="p-4 bg-purple-900/40 rounded-lg">
              <div className="text-xs text-gray-500">Total Power (with PUE)</div>
              <div className="text-lg font-bold text-green-400">{calculatedTotalPower.toFixed(1)} MW</div>
              <div className="text-sm text-gray-400">PUE: {config.currentPUE}</div>
            </div>
            <div className="p-4 bg-purple-900/40 rounded-lg">
              <div className="text-xs text-gray-500">Backup</div>
              <div className="text-lg font-bold text-yellow-400">{config.backupDurationHours} hours</div>
              <div className="text-sm text-gray-400">{config.uptimeRequirement}% uptime</div>
            </div>
          </div>

          <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-purple-400 font-medium mb-2">
              <Sparkles className="w-5 h-5" />
              Recommended BESS Configuration
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Battery Capacity</div>
                <div className="text-xl font-bold text-white">
                  {(calculatedTotalPower * config.backupDurationHours).toFixed(0)} MWh
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Power Rating</div>
                <div className="text-xl font-bold text-white">
                  {calculatedTotalPower.toFixed(1)} MW
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentQuestion = questions[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Center Configuration</h2>
              <p className="text-sm text-gray-400">Step {currentStep + 1} of {questions.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-purple-900/40 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-purple-900/40">
          <div 
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-4">
            {currentQuestion.icon}
            <div>
              <h3 className="text-lg font-semibold text-white">{currentQuestion.title}</h3>
              <p className="text-sm text-gray-400">{currentQuestion.subtitle}</p>
            </div>
          </div>
          {currentQuestion.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-800/50 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 rounded-lg bg-purple-900/40 text-gray-300 disabled:opacity-50 hover:bg-purple-800/50"
          >
            Back
          </button>
          
          {currentStep < questions.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Generate Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataCenterQuestionnaire;
