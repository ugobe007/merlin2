/**
 * PowerStatusCard Component
 * 
 * A comprehensive card showing current power configuration status.
 * Combines Power Gap, configured sources, and recommendations.
 * 
 * Used in Configuration section and results summary.
 */

import React from 'react';
import { 
  Zap, 
  Sun, 
  Wind, 
  Battery, 
  Fuel, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  Settings
} from 'lucide-react';
import { PowerGapIndicator } from './PowerGapIndicator';

export interface PowerSource {
  type: 'battery' | 'solar' | 'wind' | 'generator';
  capacityKW: number;
  configured: boolean;
  label?: string;
}

export interface PowerStatusCardProps {
  /** Total peak demand from facility */
  peakDemandKW: number;
  /** List of power sources */
  sources: PowerSource[];
  /** Grid connection type */
  gridConnection: 'on-grid' | 'unreliable' | 'expensive' | 'limited' | 'off-grid';
  /** Recommended battery size from SSOT */
  recommendedBatteryKW?: number;
  /** Whether to show configuration button */
  showConfigureButton?: boolean;
  /** Configuration button click handler */
  onConfigure?: () => void;
  /** Whether card is expanded */
  expanded?: boolean;
}

const SOURCE_ICONS: Record<PowerSource['type'], typeof Zap> = {
  battery: Battery,
  solar: Sun,
  wind: Wind,
  generator: Fuel
};

const SOURCE_COLORS: Record<PowerSource['type'], string> = {
  battery: 'text-blue-600 bg-blue-100',
  solar: 'text-yellow-600 bg-yellow-100',
  wind: 'text-cyan-600 bg-cyan-100',
  generator: 'text-gray-600 bg-gray-100'
};

const SOURCE_LABELS: Record<PowerSource['type'], string> = {
  battery: 'Battery (BESS)',
  solar: 'Solar PV',
  wind: 'Wind Turbine',
  generator: 'Generator'
};

export function PowerStatusCard({
  peakDemandKW,
  sources,
  gridConnection,
  recommendedBatteryKW,
  showConfigureButton = true,
  onConfigure,
  expanded = false
}: PowerStatusCardProps) {
  const batteryKW = sources.find(s => s.type === 'battery')?.capacityKW || 0;
  const solarKW = sources.find(s => s.type === 'solar')?.capacityKW || 0;
  const generatorKW = sources.find(s => s.type === 'generator')?.capacityKW || 0;
  const windKW = sources.find(s => s.type === 'wind')?.capacityKW || 0;
  
  const totalConfigured = batteryKW + solarKW + generatorKW + windKW;
  const configuredSources = sources.filter(s => s.configured && s.capacityKW > 0);
  const availableSources = sources.filter(s => !s.configured || s.capacityKW === 0);
  
  const coveragePercent = peakDemandKW > 0 ? (totalConfigured / peakDemandKW) * 100 : 0;
  const isFullyCovered = coveragePercent >= 100;
  const needsAttention = coveragePercent < 50 && gridConnection !== 'on-grid';
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${isFullyCovered ? 'bg-green-50' : needsAttention ? 'bg-orange-50' : 'bg-blue-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFullyCovered ? 'bg-green-100' : needsAttention ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {isFullyCovered ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : needsAttention ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : (
                <Zap className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Power Configuration</h3>
              <p className="text-sm text-gray-600">
                {isFullyCovered 
                  ? 'Fully covered by configured sources' 
                  : needsAttention
                    ? `Only ${coveragePercent.toFixed(0)}% coverage - needs attention`
                    : `${coveragePercent.toFixed(0)}% coverage configured`
                }
              </p>
            </div>
          </div>
          
          {showConfigureButton && onConfigure && (
            <button
              onClick={onConfigure}
              className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
          )}
        </div>
      </div>
      
      {/* Power Gap Indicator */}
      <div className="p-4 border-b border-gray-100">
        <PowerGapIndicator
          peakDemandKW={peakDemandKW}
          batteryKW={batteryKW}
          solarKW={solarKW}
          generatorKW={generatorKW}
          gridConnection={gridConnection}
          showDetails={expanded}
        />
      </div>
      
      {/* Configured Sources */}
      {configuredSources.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Configured Sources</h4>
          <div className="space-y-2">
            {configuredSources.map((source) => {
              const Icon = SOURCE_ICONS[source.type];
              const colorClasses = SOURCE_COLORS[source.type];
              return (
                <div key={source.type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {source.label || SOURCE_LABELS[source.type]}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {source.capacityKW.toLocaleString()} kW
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Available Sources (if expanded) */}
      {expanded && availableSources.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Available to Add</h4>
          <div className="flex flex-wrap gap-2">
            {availableSources.map((source) => {
              const Icon = SOURCE_ICONS[source.type];
              return (
                <button
                  key={source.type}
                  onClick={onConfigure}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {SOURCE_LABELS[source.type]}
                  <ChevronRight className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Recommendation */}
      {recommendedBatteryKW && recommendedBatteryKW > batteryKW && (
        <div className="p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded">
              <Battery className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Merlin Recommends: {recommendedBatteryKW.toLocaleString()} kW Battery
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Based on your facility type and peak demand
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Configured</span>
          <span className="font-semibold text-gray-800">{totalConfigured.toLocaleString()} kW</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Peak Demand</span>
          <span className="font-semibold text-gray-800">{peakDemandKW.toLocaleString()} kW</span>
        </div>
      </div>
    </div>
  );
}

export default PowerStatusCard;
