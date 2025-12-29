/**
 * PERFORMANCE METRICS PANEL
 * ==========================
 * 
 * Reusable component for tracking energy performance metrics across all use cases.
 * Key insight from Vineet: Data = Energy - better data drives better savings.
 * 
 * This component is designed for:
 * - PE firms tracking portfolio performance
 * - Multi-site operators benchmarking locations
 * - Middle East expansion (Saudi Arabia, Kuwait) with focus on KPIs
 * 
 * Use Cases: Car Wash, Hotel, EV Charging, Office, Data Center, etc.
 */

import React from 'react';
import { 
  TrendingUp, TrendingDown, Zap, Battery, DollarSign, 
  Activity, Droplets, Clock, BarChart3, Target
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  description?: string;
  benchmark?: {
    excellent: number;
    good: number;
    average: number;
  };
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number; // percentage change
}

export interface PerformanceMetricsPanelProps {
  title?: string;
  subtitle?: string;
  metrics: PerformanceMetric[];
  showBenchmarks?: boolean;
  showTrends?: boolean;
  compact?: boolean;
  useCase?: string; // For context-specific labeling
  className?: string;
}

// ============================================
// METRIC ICONS
// ============================================

const METRIC_ICONS: Record<string, React.ElementType> = {
  energyPerUnit: Zap,
  peakReduction: TrendingDown,
  monthlySavings: DollarSign,
  utilization: Activity,
  waterRecovery: Droplets,
  throughput: BarChart3,
  efficiency: Target,
  battery: Battery,
  time: Clock,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getBenchmarkLevel(value: number, benchmark?: { excellent: number; good: number; average: number }, isLowerBetter = true): 'excellent' | 'good' | 'average' | 'poor' {
  if (!benchmark) return 'average';
  
  if (isLowerBetter) {
    if (value <= benchmark.excellent) return 'excellent';
    if (value <= benchmark.good) return 'good';
    if (value <= benchmark.average) return 'average';
    return 'poor';
  } else {
    if (value >= benchmark.excellent) return 'excellent';
    if (value >= benchmark.good) return 'good';
    if (value >= benchmark.average) return 'average';
    return 'poor';
  }
}

function getBenchmarkColor(level: 'excellent' | 'good' | 'average' | 'poor'): string {
  switch (level) {
    case 'excellent': return 'text-emerald-400';
    case 'good': return 'text-cyan-400';
    case 'average': return 'text-amber-400';
    case 'poor': return 'text-red-400';
  }
}

function getBenchmarkBgColor(level: 'excellent' | 'good' | 'average' | 'poor'): string {
  switch (level) {
    case 'excellent': return 'bg-emerald-500/20 border-emerald-400/30';
    case 'good': return 'bg-cyan-500/20 border-cyan-400/30';
    case 'average': return 'bg-amber-500/20 border-amber-400/30';
    case 'poor': return 'bg-red-500/20 border-red-400/30';
  }
}

// ============================================
// COMPONENT
// ============================================

export const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
  title = 'Performance Metrics',
  subtitle,
  metrics,
  showBenchmarks = true,
  showTrends = true,
  compact = false,
  useCase,
  className = '',
}) => {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-cyan-200/70 mt-1">{subtitle}</p>
            )}
          </div>
          {useCase && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
              {useCase}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`p-4 ${compact ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-3'}`}>
        {metrics.map((metric) => {
          const benchmarkLevel = getBenchmarkLevel(
            metric.value, 
            metric.benchmark,
            // For these metrics, lower is better
            ['energyPerUnit', 'energyPerCar', 'kWhPerCar'].some(id => metric.id.toLowerCase().includes(id.toLowerCase()))
          );
          const Icon = METRIC_ICONS[metric.id] || Zap;

          if (compact) {
            return (
              <div 
                key={metric.id}
                className={`p-3 rounded-lg border ${getBenchmarkBgColor(benchmarkLevel)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${getBenchmarkColor(benchmarkLevel)}`} />
                  <span className="text-xs text-white/70 truncate">{metric.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${getBenchmarkColor(benchmarkLevel)}`}>
                    {typeof metric.value === 'number' ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.value}
                  </span>
                  <span className="text-xs text-white/50">{metric.unit}</span>
                </div>
                {showTrends && metric.trend && (
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    ) : null}
                    {metric.trendValue && (
                      <span className={`text-xs ${metric.trend === 'up' ? 'text-emerald-400' : metric.trend === 'down' ? 'text-red-400' : 'text-white/50'}`}>
                        {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div 
              key={metric.id}
              className={`p-4 rounded-lg border ${getBenchmarkBgColor(benchmarkLevel)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getBenchmarkBgColor(benchmarkLevel)}`}>
                    <Icon className={`w-5 h-5 ${getBenchmarkColor(benchmarkLevel)}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{metric.name}</p>
                    {metric.description && (
                      <p className="text-xs text-white/50">{metric.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${getBenchmarkColor(benchmarkLevel)}`}>
                      {typeof metric.value === 'number' ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.value}
                    </span>
                    <span className="text-sm text-white/50">{metric.unit}</span>
                  </div>
                  {showBenchmarks && metric.benchmark && (
                    <p className="text-xs text-white/50 mt-1">
                      Benchmark: {benchmarkLevel} ({benchmarkLevel !== 'poor' && metric.benchmark ? metric.benchmark[benchmarkLevel as 'excellent' | 'good' | 'average'] : 'N/A'} {metric.unit})
                    </p>
                  )}
                  {showTrends && metric.trend && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      ) : null}
                      {metric.trendValue && (
                        <span className={`text-xs ${metric.trend === 'up' ? 'text-emerald-400' : metric.trend === 'down' ? 'text-red-400' : 'text-white/50'}`}>
                          {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}% vs last month
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with benchmark legend */}
      {showBenchmarks && (
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white/50">Excellent</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-white/50">Good</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-white/50">Average</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-white/50">Needs Improvement</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// USE CASE SPECIFIC METRIC GENERATORS
// ============================================

/**
 * Generate car wash specific metrics
 */
export function generateCarWashMetrics(data: {
  kWhPerCar: number;
  peakReductionPercent: number;
  monthlySavings: number;
  utilizationPercent: number;
  waterRecoveryPercent?: number;
  carsPerDay: number;
}): PerformanceMetric[] {
  return [
    {
      id: 'energyPerCar',
      name: 'Energy per Car',
      value: data.kWhPerCar,
      unit: 'kWh/car',
      description: 'Energy consumed per vehicle washed',
      benchmark: { excellent: 0.5, good: 0.65, average: 0.8 },
    },
    {
      id: 'peakReduction',
      name: 'Peak Demand Reduction',
      value: data.peakReductionPercent,
      unit: '%',
      description: 'Reduction in peak demand with BESS',
      benchmark: { excellent: 40, good: 30, average: 20 },
    },
    {
      id: 'monthlySavings',
      name: 'Monthly Savings',
      value: data.monthlySavings,
      unit: '$',
      description: 'Monthly cost savings from energy optimization',
    },
    {
      id: 'utilization',
      name: 'Equipment Utilization',
      value: data.utilizationPercent,
      unit: '%',
      description: 'Percentage of time equipment is actively washing',
      benchmark: { excellent: 70, good: 55, average: 40 },
    },
    ...(data.waterRecoveryPercent ? [{
      id: 'waterRecovery',
      name: 'Water Recovery Rate',
      value: data.waterRecoveryPercent,
      unit: '%',
      description: 'Percentage of water recycled',
      benchmark: { excellent: 85, good: 70, average: 50 },
    }] : []),
    {
      id: 'throughput',
      name: 'Daily Throughput',
      value: data.carsPerDay,
      unit: 'cars/day',
      description: 'Number of vehicles washed per day',
    },
  ];
}

/**
 * Generate hotel specific metrics
 */
export function generateHotelMetrics(data: {
  kWhPerRoom: number;
  peakReductionPercent: number;
  monthlySavings: number;
  occupancyPercent: number;
  energyStarScore?: number;
}): PerformanceMetric[] {
  return [
    {
      id: 'energyPerRoom',
      name: 'Energy per Room',
      value: data.kWhPerRoom,
      unit: 'kWh/room/day',
      description: 'Daily energy consumption per occupied room',
      benchmark: { excellent: 30, good: 45, average: 60 },
    },
    {
      id: 'peakReduction',
      name: 'Peak Demand Reduction',
      value: data.peakReductionPercent,
      unit: '%',
      description: 'Reduction in peak demand with BESS',
      benchmark: { excellent: 35, good: 25, average: 15 },
    },
    {
      id: 'monthlySavings',
      name: 'Monthly Savings',
      value: data.monthlySavings,
      unit: '$',
      description: 'Monthly cost savings from energy optimization',
    },
    {
      id: 'occupancy',
      name: 'Occupancy Rate',
      value: data.occupancyPercent,
      unit: '%',
      description: 'Average occupancy rate',
      benchmark: { excellent: 85, good: 70, average: 55 },
    },
    ...(data.energyStarScore ? [{
      id: 'energyStar',
      name: 'ENERGY STAR Score',
      value: data.energyStarScore,
      unit: 'pts',
      description: 'EPA ENERGY STAR rating',
      benchmark: { excellent: 90, good: 75, average: 50 },
    }] : []),
  ];
}

/**
 * Generate EV charging specific metrics
 */
export function generateEVChargingMetrics(data: {
  kWhDelivered: number;
  sessionsPerDay: number;
  avgSessionDuration: number;
  uptime: number;
  peakReductionPercent: number;
  revenuePerSession: number;
}): PerformanceMetric[] {
  return [
    {
      id: 'kWhDelivered',
      name: 'Energy Delivered',
      value: data.kWhDelivered,
      unit: 'kWh/day',
      description: 'Total energy delivered to vehicles',
    },
    {
      id: 'sessions',
      name: 'Charging Sessions',
      value: data.sessionsPerDay,
      unit: 'sessions/day',
      description: 'Number of charging sessions per day',
    },
    {
      id: 'uptime',
      name: 'Charger Uptime',
      value: data.uptime,
      unit: '%',
      description: 'Percentage of time chargers are operational',
      benchmark: { excellent: 98, good: 95, average: 90 },
    },
    {
      id: 'peakReduction',
      name: 'Peak Demand Reduction',
      value: data.peakReductionPercent,
      unit: '%',
      description: 'Reduction in peak demand with BESS',
      benchmark: { excellent: 50, good: 35, average: 20 },
    },
    {
      id: 'revenue',
      name: 'Revenue per Session',
      value: data.revenuePerSession,
      unit: '$',
      description: 'Average revenue per charging session',
    },
  ];
}

export default PerformanceMetricsPanel;
