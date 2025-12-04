/**
 * KEY METRICS DASHBOARD COMPONENT
 * ================================
 * 
 * Displays the most important metrics users care about for each vertical.
 * Adapts automatically based on use case/vertical type.
 * 
 * Version: 1.0.0
 * Date: December 3, 2025
 */

import React from 'react';
import { 
  calculateCO2Avoided, 
  quickCO2Estimate,
  type EnvironmentalMetrics 
} from '@/services/environmentalMetricsService';

// ============================================================================
// INTERFACES
// ============================================================================

export type VerticalType = 
  | 'ev-charging' 
  | 'solar' 
  | 'wind' 
  | 'bess' 
  | 'microgrid' 
  | 'power-generation'
  | 'car-wash'
  | 'hotel'
  | 'hospital'
  | 'data-center'
  | 'manufacturing'
  | 'retail'
  | 'office'
  | 'apartment'
  | 'generic';

export interface MetricValue {
  value: number | string;
  unit?: string;
  label: string;
  icon: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'cyan' | 'yellow';
  tooltip?: string;
  highlight?: boolean;
}

export interface KeyMetricsInput {
  // System details
  vertical: VerticalType;
  systemSizeKW?: number;
  systemSizeKWh?: number;
  durationHours?: number;
  
  // Financial metrics
  totalProjectCost?: number;
  netCost?: number;
  annualSavings?: number;
  paybackYears?: number;
  roi10Year?: number;
  roi25Year?: number;
  npv?: number;
  irr?: number;
  lcoe?: number;
  lcos?: number;
  
  // Operational metrics
  utilizationPercent?: number;
  availabilityPercent?: number;
  efficiencyPercent?: number;
  capacityFactor?: number;
  
  // EV-specific
  totalChargers?: number;
  chargingSessionsPerDay?: number;
  revenuePerPort?: number;
  peakDemandReduction?: number;
  
  // Environmental
  state?: string;
  annualKWhDisplaced?: number;
  annualKWhGenerated?: number;
  solarMW?: number;
  windMW?: number;
  
  // Reliability
  resilienceHours?: number;
  criticalLoadPercent?: number;
  uptimeSLA?: number;
  
  // Custom overrides
  customMetrics?: MetricValue[];
}

// ============================================================================
// METRIC CONFIGURATIONS BY VERTICAL
// ============================================================================

const VERTICAL_METRIC_PRIORITY: Record<VerticalType, string[]> = {
  'ev-charging': ['payback', 'annualSavings', 'co2Avoided', 'peakDemandReduction', 'utilizationPercent', 'revenuePerPort'],
  'solar': ['payback', 'annualSavings', 'co2Avoided', 'annualProduction', 'lcoe', 'systemSize'],
  'wind': ['lcoe', 'capacityFactor', 'annualProduction', 'payback', 'co2Avoided', 'irr'],
  'bess': ['payback', 'annualSavings', 'lcos', 'efficiencyPercent', 'co2Avoided', 'resilienceHours'],
  'microgrid': ['resilienceHours', 'renewablePercent', 'payback', 'co2Avoided', 'criticalLoadPercent', 'annualSavings'],
  'power-generation': ['uptimeSLA', 'resilienceHours', 'payback', 'capacityFactor', 'criticalLoadPercent', 'co2Avoided'],
  'car-wash': ['payback', 'annualSavings', 'peakDemandReduction', 'co2Avoided', 'roi10Year', 'systemSize'],
  'hotel': ['payback', 'annualSavings', 'co2Avoided', 'resilienceHours', 'peakDemandReduction', 'roi10Year'],
  'hospital': ['resilienceHours', 'uptimeSLA', 'criticalLoadPercent', 'payback', 'annualSavings', 'co2Avoided'],
  'data-center': ['uptimeSLA', 'resilienceHours', 'efficiencyPercent', 'payback', 'annualSavings', 'co2Avoided'],
  'manufacturing': ['payback', 'peakDemandReduction', 'annualSavings', 'resilienceHours', 'co2Avoided', 'roi10Year'],
  'retail': ['payback', 'annualSavings', 'co2Avoided', 'peakDemandReduction', 'roi10Year', 'systemSize'],
  'office': ['payback', 'annualSavings', 'co2Avoided', 'peakDemandReduction', 'resilienceHours', 'roi10Year'],
  'apartment': ['payback', 'annualSavings', 'co2Avoided', 'resilienceHours', 'peakDemandReduction', 'roi10Year'],
  'generic': ['payback', 'annualSavings', 'co2Avoided', 'roi10Year', 'systemSize', 'netCost'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatNumber(value: number, decimals: number = 0): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

function getColorClass(color: MetricValue['color']): string {
  const colorMap = {
    green: 'from-green-500 to-emerald-600 text-green-400',
    blue: 'from-blue-500 to-indigo-600 text-blue-400',
    purple: 'from-purple-500 to-violet-600 text-purple-400',
    orange: 'from-orange-500 to-amber-600 text-orange-400',
    red: 'from-red-500 to-rose-600 text-red-400',
    cyan: 'from-cyan-500 to-teal-600 text-cyan-400',
    yellow: 'from-yellow-500 to-amber-500 text-yellow-400',
  };
  return colorMap[color] || colorMap.green;
}

// ============================================================================
// METRIC GENERATORS
// ============================================================================

function generateMetric(
  key: string,
  input: KeyMetricsInput,
  co2Data?: EnvironmentalMetrics
): MetricValue | null {
  switch (key) {
    case 'payback':
      if (input.paybackYears === undefined) return null;
      return {
        value: input.paybackYears.toFixed(1),
        unit: 'years',
        label: 'Payback Period',
        icon: '⏱️',
        color: input.paybackYears <= 5 ? 'green' : input.paybackYears <= 8 ? 'yellow' : 'orange',
        highlight: true,
        tooltip: 'Time to recover your investment',
      };
      
    case 'annualSavings':
      if (!input.annualSavings) return null;
      return {
        value: formatCurrency(input.annualSavings),
        label: 'Annual Savings',
        icon: '💰',
        color: 'green',
        highlight: true,
        tooltip: 'Estimated savings per year from reduced electricity costs',
      };
      
    case 'co2Avoided':
      if (!co2Data) return null;
      return {
        value: formatNumber(co2Data.co2AvoidedTonsPerYear, 1),
        unit: 'tons/year',
        label: 'CO₂ Avoided',
        icon: '🌱',
        color: 'green',
        tooltip: `Equivalent to planting ${co2Data.equivalencies.treesPlanted.toLocaleString()} trees`,
      };
      
    case 'peakDemandReduction':
      if (!input.peakDemandReduction) return null;
      return {
        value: formatNumber(input.peakDemandReduction),
        unit: 'kW',
        label: 'Peak Demand Reduction',
        icon: '📉',
        color: 'blue',
        tooltip: 'Reduction in peak power demand from grid',
      };
      
    case 'utilizationPercent':
      if (input.utilizationPercent === undefined) return null;
      return {
        value: input.utilizationPercent.toFixed(0),
        unit: '%',
        label: 'Utilization Rate',
        icon: '📊',
        color: input.utilizationPercent >= 60 ? 'green' : input.utilizationPercent >= 40 ? 'yellow' : 'orange',
        tooltip: 'How efficiently the system is being used',
      };
      
    case 'revenuePerPort':
      if (!input.revenuePerPort) return null;
      return {
        value: formatCurrency(input.revenuePerPort),
        unit: '/month',
        label: 'Revenue per Port',
        icon: '💵',
        color: 'green',
        tooltip: 'Average monthly revenue per charging port',
      };
      
    case 'resilienceHours':
      if (!input.resilienceHours) return null;
      return {
        value: formatNumber(input.resilienceHours),
        unit: 'hours',
        label: 'Backup Duration',
        icon: '🔋',
        color: input.resilienceHours >= 24 ? 'green' : input.resilienceHours >= 8 ? 'yellow' : 'orange',
        highlight: ['hospital', 'data-center', 'microgrid'].includes(input.vertical),
        tooltip: 'Hours of backup power during grid outage',
      };
      
    case 'uptimeSLA':
      if (input.uptimeSLA === undefined) return null;
      return {
        value: input.uptimeSLA.toFixed(2),
        unit: '%',
        label: 'Uptime SLA',
        icon: '✅',
        color: input.uptimeSLA >= 99.9 ? 'green' : input.uptimeSLA >= 99 ? 'yellow' : 'red',
        highlight: ['hospital', 'data-center'].includes(input.vertical),
        tooltip: 'Guaranteed system availability',
      };
      
    case 'criticalLoadPercent':
      if (input.criticalLoadPercent === undefined) return null;
      return {
        value: input.criticalLoadPercent.toFixed(0),
        unit: '%',
        label: 'Critical Load Coverage',
        icon: '⚡',
        color: input.criticalLoadPercent >= 100 ? 'green' : input.criticalLoadPercent >= 80 ? 'yellow' : 'orange',
        tooltip: 'Percentage of critical loads covered by backup',
      };
      
    case 'roi10Year':
      if (input.roi10Year === undefined) return null;
      return {
        value: input.roi10Year.toFixed(0),
        unit: '%',
        label: '10-Year ROI',
        icon: '📈',
        color: input.roi10Year >= 100 ? 'green' : input.roi10Year >= 50 ? 'yellow' : 'orange',
        tooltip: 'Return on investment over 10 years',
      };
      
    case 'roi25Year':
      if (input.roi25Year === undefined) return null;
      return {
        value: input.roi25Year.toFixed(0),
        unit: '%',
        label: '25-Year ROI',
        icon: '📈',
        color: 'green',
        tooltip: 'Return on investment over system lifetime',
      };
      
    case 'npv':
      if (input.npv === undefined) return null;
      return {
        value: formatCurrency(input.npv),
        label: 'Net Present Value',
        icon: '💎',
        color: input.npv > 0 ? 'green' : 'red',
        tooltip: 'Present value of all future cash flows',
      };
      
    case 'irr':
      if (input.irr === undefined) return null;
      return {
        value: input.irr.toFixed(1),
        unit: '%',
        label: 'IRR',
        icon: '📊',
        color: input.irr >= 15 ? 'green' : input.irr >= 8 ? 'yellow' : 'orange',
        tooltip: 'Internal Rate of Return',
      };
      
    case 'lcoe':
      if (input.lcoe === undefined) return null;
      return {
        value: `$${input.lcoe.toFixed(3)}`,
        unit: '/kWh',
        label: 'LCOE',
        icon: '⚡',
        color: input.lcoe <= 0.05 ? 'green' : input.lcoe <= 0.08 ? 'yellow' : 'orange',
        tooltip: 'Levelized Cost of Energy',
      };
      
    case 'lcos':
      if (input.lcos === undefined) return null;
      return {
        value: `$${input.lcos.toFixed(3)}`,
        unit: '/kWh',
        label: 'LCOS',
        icon: '🔋',
        color: input.lcos <= 0.15 ? 'green' : input.lcos <= 0.25 ? 'yellow' : 'orange',
        tooltip: 'Levelized Cost of Storage',
      };
      
    case 'efficiencyPercent':
      if (input.efficiencyPercent === undefined) return null;
      return {
        value: input.efficiencyPercent.toFixed(0),
        unit: '%',
        label: 'Round-Trip Efficiency',
        icon: '🔄',
        color: input.efficiencyPercent >= 90 ? 'green' : input.efficiencyPercent >= 85 ? 'yellow' : 'orange',
        tooltip: 'Energy efficiency of charge/discharge cycle',
      };
      
    case 'capacityFactor':
      if (input.capacityFactor === undefined) return null;
      return {
        value: (input.capacityFactor * 100).toFixed(0),
        unit: '%',
        label: 'Capacity Factor',
        icon: '📊',
        color: input.capacityFactor >= 0.30 ? 'green' : input.capacityFactor >= 0.20 ? 'yellow' : 'orange',
        tooltip: 'Actual output vs theoretical maximum',
      };
      
    case 'systemSize':
      if (!input.systemSizeKW && !input.systemSizeKWh) return null;
      const size = input.systemSizeKW || (input.systemSizeKWh! / (input.durationHours || 4));
      return {
        value: size >= 1000 ? (size / 1000).toFixed(1) : size.toFixed(0),
        unit: size >= 1000 ? 'MW' : 'kW',
        label: 'System Size',
        icon: '⚡',
        color: 'blue',
        tooltip: 'Total power capacity',
      };
      
    case 'netCost':
      if (!input.netCost) return null;
      return {
        value: formatCurrency(input.netCost),
        label: 'Net Cost (after ITC)',
        icon: '💵',
        color: 'blue',
        tooltip: 'Total cost after 30% federal tax credit',
      };
      
    case 'annualProduction':
      if (!input.systemSizeKW) return null;
      const annualKWh = input.systemSizeKW * (input.vertical === 'wind' ? 2500 : 1400);
      return {
        value: formatNumber(annualKWh / 1000, 0),
        unit: 'MWh/year',
        label: 'Annual Production',
        icon: '⚡',
        color: 'cyan',
        tooltip: 'Estimated annual energy production',
      };
      
    case 'renewablePercent':
      if (!co2Data || co2Data.renewablePercentage === 0) return null;
      return {
        value: co2Data.renewablePercentage.toFixed(0),
        unit: '%',
        label: 'Renewable Energy',
        icon: '☀️',
        color: co2Data.renewablePercentage >= 80 ? 'green' : co2Data.renewablePercentage >= 50 ? 'yellow' : 'orange',
        tooltip: 'Percentage of energy from renewable sources',
      };
      
    default:
      return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface KeyMetricsDashboardProps {
  input: KeyMetricsInput;
  layout?: 'grid' | 'horizontal' | 'compact';
  maxMetrics?: number;
  showCO2Details?: boolean;
  className?: string;
}

export const KeyMetricsDashboard: React.FC<KeyMetricsDashboardProps> = ({
  input,
  layout = 'grid',
  maxMetrics = 6,
  showCO2Details = false,
  className = '',
}) => {
  // Calculate CO2 metrics if we have enough data
  let co2Data: EnvironmentalMetrics | undefined;
  
  if (input.annualKWhDisplaced || input.annualSavings) {
    const annualKWh = input.annualKWhDisplaced || (input.annualSavings! / 0.15); // Estimate kWh from savings
    const systemType = ['ev-charging', 'solar', 'bess'].includes(input.vertical) 
      ? input.vertical as 'ev-charging' | 'solar' | 'bess'
      : 'bess';
    
    co2Data = calculateCO2Avoided({
      annualKWhDisplaced: annualKWh,
      annualKWhGenerated: input.annualKWhGenerated || 0,
      annualKWhFromGrid: annualKWh * 0.3,
      state: input.state,
      systemType,
      solarMW: input.solarMW,
      windMW: input.windMW,
    });
  }
  
  // Get priority metrics for this vertical
  const priorityKeys = VERTICAL_METRIC_PRIORITY[input.vertical] || VERTICAL_METRIC_PRIORITY.generic;
  
  // Generate metrics
  const metrics: MetricValue[] = [];
  
  for (const key of priorityKeys) {
    if (metrics.length >= maxMetrics) break;
    
    const metric = generateMetric(key, input, co2Data);
    if (metric) {
      metrics.push(metric);
    }
  }
  
  // Add custom metrics
  if (input.customMetrics) {
    for (const custom of input.customMetrics) {
      if (metrics.length >= maxMetrics) break;
      metrics.push(custom);
    }
  }
  
  // Render based on layout
  if (layout === 'compact') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {metrics.map((metric, i) => (
          <div 
            key={i}
            className={`px-3 py-2 rounded-lg bg-white/5 border border-white/10 ${
              metric.highlight ? 'ring-1 ring-green-500/30' : ''
            }`}
            title={metric.tooltip}
          >
            <span className="text-lg mr-1">{metric.icon}</span>
            <span className="text-white font-semibold">{metric.value}</span>
            {metric.unit && <span className="text-white/60 text-sm ml-1">{metric.unit}</span>}
            <span className="text-white/40 text-xs ml-2">{metric.label}</span>
          </div>
        ))}
      </div>
    );
  }
  
  if (layout === 'horizontal') {
    return (
      <div className={`flex gap-4 overflow-x-auto pb-2 ${className}`}>
        {metrics.map((metric, i) => (
          <div 
            key={i}
            className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-br ${getColorClass(metric.color).split(' ')[0]} ${getColorClass(metric.color).split(' ')[1]} bg-opacity-10 border border-white/10 min-w-[140px] ${
              metric.highlight ? 'ring-2 ring-white/20' : ''
            }`}
            title={metric.tooltip}
          >
            <div className="text-2xl mb-1">{metric.icon}</div>
            <div className="text-2xl font-bold text-white">
              {metric.value}
              {metric.unit && <span className="text-sm font-normal text-white/70 ml-1">{metric.unit}</span>}
            </div>
            <div className="text-xs text-white/60 mt-1">{metric.label}</div>
          </div>
        ))}
      </div>
    );
  }
  
  // Default grid layout
  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, i) => (
          <div 
            key={i}
            className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${
              metric.highlight ? 'ring-2 ring-green-500/30 bg-green-500/5' : ''
            }`}
            title={metric.tooltip}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{metric.icon}</span>
              <span className="text-xs text-white/50 uppercase tracking-wide">{metric.label}</span>
            </div>
            <div className={`text-2xl font-bold ${getColorClass(metric.color).split(' ')[2]}`}>
              {metric.value}
              {metric.unit && <span className="text-sm font-normal text-white/50 ml-1">{metric.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* CO2 Details Panel (optional) */}
      {showCO2Details && co2Data && (
        <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <span>🌍</span> Environmental Impact
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-white/50">CO₂ Avoided (25yr)</div>
              <div className="text-white font-semibold">{co2Data.co2Avoided25YearsTons.toLocaleString()} tons</div>
            </div>
            <div>
              <div className="text-white/50">Trees Equivalent</div>
              <div className="text-white font-semibold">{co2Data.equivalencies.treesPlanted.toLocaleString()} trees</div>
            </div>
            <div>
              <div className="text-white/50">Cars Off Road</div>
              <div className="text-white font-semibold">{co2Data.equivalencies.carsOffRoad.toFixed(1)} cars/year</div>
            </div>
            <div>
              <div className="text-white/50">Carbon Credit Value</div>
              <div className="text-white font-semibold">${co2Data.carbonCreditValue.midEstimate.toLocaleString()}/year</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// QUICK METRIC COMPONENTS
// ============================================================================

interface SingleMetricProps {
  icon: string;
  value: string | number;
  unit?: string;
  label: string;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

export const SingleMetric: React.FC<SingleMetricProps> = ({
  icon,
  value,
  unit,
  label,
  color = 'green',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-2 text-lg',
    md: 'p-4 text-2xl',
    lg: 'p-6 text-4xl',
  };
  
  return (
    <div className={`rounded-xl bg-white/5 border border-white/10 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-white/50 uppercase">{label}</span>
      </div>
      <div className={`font-bold ${getColorClass(color).split(' ')[2]}`}>
        {value}
        {unit && <span className="text-sm font-normal text-white/50 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

interface CO2BadgeProps {
  annualSavingsKWh: number;
  state?: string;
  systemType?: 'bess' | 'solar' | 'ev-charging';
}

export const CO2Badge: React.FC<CO2BadgeProps> = ({
  annualSavingsKWh,
  state = 'California',
  systemType = 'bess',
}) => {
  const { co2TonsPerYear, treesEquivalent } = quickCO2Estimate(annualSavingsKWh, state, systemType);
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
      <span>🌱</span>
      <span className="text-green-400 font-semibold">{co2TonsPerYear} tons CO₂/year</span>
      <span className="text-green-300/60 text-sm">≈ {treesEquivalent} trees</span>
    </div>
  );
};

export default KeyMetricsDashboard;
