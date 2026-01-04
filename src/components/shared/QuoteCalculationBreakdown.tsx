/**
 * QUOTE CALCULATION BREAKDOWN
 * ===========================
 * 
 * Shows transparent calculation methodology for every quote.
 * Users can see exactly how we arrived at each number.
 * 
 * KEY PRINCIPLE: "Show Our Work"
 * - Every number has a source
 * - Every formula is visible
 * - Every assumption is documented
 * 
 * PRICING TIERS (Dec 2025 Benchmarks):
 * - Residential (< 50 kW): Premium pricing, simpler equipment
 * - Commercial/C&I (50 kW - 1 MW): Mid-range, modular equipment
 * - Utility-scale (> 1 MW): Volume pricing, standardized units
 * 
 * Version: 1.0.0
 * Date: December 4, 2025
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, Battery, Sun, Zap, DollarSign, Info, ExternalLink, FileText, Sparkles } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

export interface PricingAssumption {
  item: string;
  value: number;
  unit: string;
  source: string;
  tier: 'residential' | 'commercial' | 'utility';
}

export interface CalculationStep {
  description: string;
  formula: string;
  inputs: { name: string; value: number | string; unit: string }[];
  result: number;
  resultUnit: string;
}

export interface ComponentBreakdown {
  name: string;
  icon: React.ElementType;
  assumptions: PricingAssumption[];
  calculations: CalculationStep[];
  subtotal: number;
}

export interface QuoteCalculationData {
  systemCategory: 'residential' | 'commercial' | 'utility';
  components: {
    bess?: ComponentBreakdown;
    solar?: ComponentBreakdown;
    wind?: ComponentBreakdown;
    generators?: ComponentBreakdown;
    evChargers?: ComponentBreakdown;
  };
  installationBreakdown: {
    logistics: number;
    importDuty: number;
    epcIntegration: number;
    contingency: number;
  };
  financialAssumptions: {
    discountRate: number;
    projectLifeYears: number;
    federalITC: number;
    degradationRate: number;
    electricityRate: number;
    demandChargeRate: number;
  };
  totals: {
    equipmentCost: number;
    installationCost: number;
    grossCost: number;
    taxCredit: number;
    netCost: number;
  };
}

interface QuoteCalculationBreakdownProps {
  data: QuoteCalculationData;
  colorScheme?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'indigo';
  defaultExpanded?: boolean;
}

// ============================================
// PRICING TIER DESCRIPTIONS
// ============================================

const TIER_INFO = {
  residential: {
    label: 'Residential',
    range: '< 50 kW',
    description: 'Home battery systems with premium pricing for smaller scale',
    color: 'text-emerald-400',
  },
  commercial: {
    label: 'Commercial/C&I',
    range: '50 kW - 1 MW',
    description: 'Business-scale systems with modular equipment',
    color: 'text-cyan-400',
  },
  utility: {
    label: 'Utility-Scale',
    range: '> 1 MW',
    description: 'Large-scale systems with volume pricing',
    color: 'text-purple-400',
  },
};

// ============================================
// COLOR SCHEMES
// ============================================

const COLOR_SCHEMES = {
  cyan: { accent: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  purple: { accent: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  emerald: { accent: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  amber: { accent: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  indigo: { accent: 'indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
};

// ============================================
// HELPER COMPONENTS
// ============================================

const FormatCurrency = ({ value }: { value: number }) => {
  if (value >= 1000000) {
    return <>${(value / 1000000).toFixed(2)}M</>;
  } else if (value >= 1000) {
    return <>${(value / 1000).toFixed(1)}K</>;
  }
  return <>${value.toLocaleString()}</>;
};

const AssumptionRow = ({ assumption }: { assumption: PricingAssumption }) => (
  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
    <td className="py-2 px-3 text-white/90">{assumption.item}</td>
    <td className="py-2 px-3 text-right font-mono text-cyan-300">
      {typeof assumption.value === 'number' 
        ? assumption.value.toLocaleString() 
        : assumption.value}
      <span className="text-white/50 ml-1">{assumption.unit}</span>
    </td>
    <td className="py-2 px-3 text-white/50 text-sm">{assumption.source}</td>
  </tr>
);

const CalculationRow = ({ step, index }: { step: CalculationStep; index: number }) => (
  <div className="bg-white/5 rounded-lg p-3 mb-2">
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">
        {index + 1}
      </span>
      <div className="flex-1">
        <p className="text-white/90 font-medium">{step.description}</p>
        <div className="mt-2 bg-slate-900/50 rounded p-2 font-mono text-sm">
          <span className="text-purple-300">{step.formula}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {step.inputs.map((input, i) => (
            <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded">
              {input.name}: <span className="text-cyan-300">{input.value}</span> {input.unit}
            </span>
          ))}
        </div>
        <div className="mt-2 text-right">
          <span className="text-white/50 text-sm">Result: </span>
          <span className="text-emerald-400 font-bold">
            {step.result.toLocaleString()} {step.resultUnit}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// COMPONENT SECTION
// ============================================

const ComponentSection = ({ 
  component, 
  isExpanded, 
  onToggle 
}: { 
  component: ComponentBreakdown; 
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const Icon = component.icon;
  
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">{component.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cyan-400 font-bold">
            <FormatCurrency value={component.subtotal} />
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/50" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Pricing Assumptions */}
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Pricing Assumptions
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-right">Value</th>
                  <th className="py-2 px-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {component.assumptions.map((assumption, i) => (
                  <AssumptionRow key={i} assumption={assumption} />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Calculation Steps */}
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Calculation Steps
            </h4>
            {component.calculations.map((step, i) => (
              <CalculationRow key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuoteCalculationBreakdown({
  data,
  colorScheme = 'cyan',
  defaultExpanded = false,
}: QuoteCalculationBreakdownProps) {
  const [isMainExpanded, setIsMainExpanded] = useState(defaultExpanded);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  
  const colors = COLOR_SCHEMES[colorScheme];
  const tierInfo = TIER_INFO[data.systemCategory];
  
  const toggleComponent = (name: string) => {
    setExpandedComponents(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };
  
  return (
    <div className={`rounded-2xl border ${colors.border} overflow-hidden`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsMainExpanded(!isMainExpanded)}
        className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <Calculator className={`w-6 h-6 ${colors.text}`} />
          <div className="text-left">
            <h3 className="font-bold text-white">How We Calculated This Quote</h3>
            <p className="text-sm text-white/60">
              {tierInfo.label} Pricing • {tierInfo.range}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">
            {Object.keys(data.components).length} components
          </span>
          {isMainExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/50" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isMainExpanded && (
        <div className="p-4 space-y-6">
          {/* Pricing Tier Info */}
          <div className={`${colors.bg} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <Sparkles className={`w-5 h-5 ${tierInfo.color} flex-shrink-0 mt-0.5`} />
              <div>
                <h4 className={`font-bold ${tierInfo.color}`}>{tierInfo.label} Pricing Tier</h4>
                <p className="text-sm text-white/70 mt-1">{tierInfo.description}</p>
              </div>
            </div>
          </div>
          
          {/* Component Breakdowns */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Equipment Cost Breakdown
            </h3>
            
            {data.components.bess && (
              <ComponentSection
                component={data.components.bess}
                isExpanded={expandedComponents.has('bess')}
                onToggle={() => toggleComponent('bess')}
              />
            )}
            
            {data.components.solar && (
              <ComponentSection
                component={data.components.solar}
                isExpanded={expandedComponents.has('solar')}
                onToggle={() => toggleComponent('solar')}
              />
            )}
            
            {data.components.wind && (
              <ComponentSection
                component={data.components.wind}
                isExpanded={expandedComponents.has('wind')}
                onToggle={() => toggleComponent('wind')}
              />
            )}
            
            {data.components.generators && (
              <ComponentSection
                component={data.components.generators}
                isExpanded={expandedComponents.has('generators')}
                onToggle={() => toggleComponent('generators')}
              />
            )}
            
            {data.components.evChargers && (
              <ComponentSection
                component={data.components.evChargers}
                isExpanded={expandedComponents.has('evChargers')}
                onToggle={() => toggleComponent('evChargers')}
              />
            )}
          </div>
          
          {/* Installation Costs */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Installation & Integration
            </h3>
            <div className="bg-white/5 rounded-xl p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 text-white/70">Logistics (8% of equipment)</td>
                    <td className="py-2 text-right font-mono text-white">
                      <FormatCurrency value={data.installationBreakdown.logistics} />
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 text-white/70">Import Duty (2% of equipment)</td>
                    <td className="py-2 text-right font-mono text-white">
                      <FormatCurrency value={data.installationBreakdown.importDuty} />
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 text-white/70">EPC / Integration (25% of equipment)</td>
                    <td className="py-2 text-right font-mono text-white">
                      <FormatCurrency value={data.installationBreakdown.epcIntegration} />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-white/70">Contingency & Permitting (5%)</td>
                    <td className="py-2 text-right font-mono text-white">
                      <FormatCurrency value={data.installationBreakdown.contingency} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Financial Assumptions */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Financial Assumptions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Discount Rate</p>
                <p className="text-lg font-bold text-white">{data.financialAssumptions.discountRate}%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Project Life</p>
                <p className="text-lg font-bold text-white">{data.financialAssumptions.projectLifeYears} years</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Federal ITC</p>
                <p className="text-lg font-bold text-emerald-400">{data.financialAssumptions.federalITC}%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Degradation</p>
                <p className="text-lg font-bold text-white">{data.financialAssumptions.degradationRate}%/yr</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Electricity Rate</p>
                <p className="text-lg font-bold text-white">${data.financialAssumptions.electricityRate}/kWh</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 uppercase">Demand Charge</p>
                <p className="text-lg font-bold text-white">${data.financialAssumptions.demandChargeRate}/kW</p>
              </div>
            </div>
          </div>
          
          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-lg font-bold text-white mb-4">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Total Equipment Cost</span>
                <span className="font-mono text-white"><FormatCurrency value={data.totals.equipmentCost} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Installation & Integration</span>
                <span className="font-mono text-white"><FormatCurrency value={data.totals.installationCost} /></span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white font-semibold">Gross Project Cost</span>
                <span className="font-mono text-white font-bold"><FormatCurrency value={data.totals.grossCost} /></span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Federal Tax Credit ({data.financialAssumptions.federalITC}% ITC)</span>
                <span className="font-mono">-<FormatCurrency value={data.totals.taxCredit} /></span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-white font-bold text-lg">Net Cost After Incentives</span>
                <span className="font-mono text-emerald-400 font-bold text-lg">
                  <FormatCurrency value={data.totals.netCost} />
                </span>
              </div>
            </div>
          </div>
          
          {/* Data Sources */}
          <div className="text-center text-xs text-white/40 pt-2 border-t border-white/10">
            <p className="flex items-center justify-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Pricing based on NREL ATB 2024, professional quote benchmarks (Oct-Dec 2025), and industry standards
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER: Generate BESS Breakdown Data
// ============================================

export function generateBESSBreakdown(
  powerKW: number,
  capacityKWh: number,
  durationHours: number,
  pricingTier: 'residential' | 'commercial' | 'utility'
): ComponentBreakdown {
  // Tier-based pricing (Dec 2025 benchmarks)
  const batteryPricePerKWh = {
    residential: 350,
    commercial: 175,
    utility: 140,
  }[pricingTier];
  
  const pcsPerKW = {
    residential: 200,
    commercial: 120,
    utility: 100,
  }[pricingTier];
  
  const batteryCost = capacityKWh * batteryPricePerKWh;
  const pcsCost = powerKW * pcsPerKW;
  const subtotal = batteryCost + pcsCost;
  
  return {
    name: 'Battery Energy Storage System (BESS)',
    icon: Battery,
    assumptions: [
      { item: 'Battery Price', value: batteryPricePerKWh, unit: '$/kWh', source: 'NREL ATB 2024 + Market', tier: pricingTier },
      { item: 'PCS/Inverter Price', value: pcsPerKW, unit: '$/kW', source: 'Professional Quotes Oct 2025', tier: pricingTier },
      { item: 'System Power', value: powerKW, unit: 'kW', source: 'User Input', tier: pricingTier },
      { item: 'Energy Capacity', value: capacityKWh, unit: 'kWh', source: 'Calculated', tier: pricingTier },
      { item: 'Duration', value: durationHours, unit: 'hours', source: 'User Input', tier: pricingTier },
    ],
    calculations: [
      {
        description: 'Calculate battery module cost',
        formula: 'Battery Cost = Capacity (kWh) × Price per kWh',
        inputs: [
          { name: 'Capacity', value: capacityKWh, unit: 'kWh' },
          { name: 'Price', value: batteryPricePerKWh, unit: '$/kWh' },
        ],
        result: batteryCost,
        resultUnit: '$',
      },
      {
        description: 'Calculate PCS/inverter cost',
        formula: 'PCS Cost = Power (kW) × Price per kW',
        inputs: [
          { name: 'Power', value: powerKW, unit: 'kW' },
          { name: 'Price', value: pcsPerKW, unit: '$/kW' },
        ],
        result: pcsCost,
        resultUnit: '$',
      },
      {
        description: 'Sum BESS component costs',
        formula: 'BESS Total = Battery Cost + PCS Cost',
        inputs: [
          { name: 'Battery', value: batteryCost, unit: '$' },
          { name: 'PCS', value: pcsCost, unit: '$' },
        ],
        result: subtotal,
        resultUnit: '$',
      },
    ],
    subtotal,
  };
}

// ============================================
// HELPER: Generate Solar Breakdown Data
// ============================================

export function generateSolarBreakdown(
  systemSizeKW: number,
  pricingTier: 'residential' | 'commercial' | 'utility'
): ComponentBreakdown {
  // Tier-based pricing (Dec 2025 benchmarks)
  const pricePerWatt = {
    residential: 2.80,
    commercial: 1.05,
    utility: 0.65,
  }[pricingTier];
  
  const totalCost = systemSizeKW * 1000 * pricePerWatt;
  
  return {
    name: 'Solar PV Array',
    icon: Sun,
    assumptions: [
      { item: 'System Price', value: pricePerWatt, unit: '$/W', source: 'NREL + Professional Quotes', tier: pricingTier },
      { item: 'System Size', value: systemSizeKW, unit: 'kW', source: 'User Selection', tier: pricingTier },
      { item: 'Panel Efficiency', value: 21.5, unit: '%', source: 'Tier-1 Mono-PERC', tier: pricingTier },
    ],
    calculations: [
      {
        description: 'Calculate turnkey solar system cost',
        formula: 'Solar Cost = System Size (kW) × 1000 × Price per Watt',
        inputs: [
          { name: 'System Size', value: systemSizeKW, unit: 'kW' },
          { name: 'Price', value: pricePerWatt, unit: '$/W' },
        ],
        result: totalCost,
        resultUnit: '$',
      },
    ],
    subtotal: totalCost,
  };
}
