/**
 * Power Gap Visualization Component
 * 
 * The "aha moment" - shows customers EXACTLY what they need vs what they have.
 * This is Merlin's intelligence made visible.
 */

import React from 'react';
import type { PowerGapAnalysis } from '@/services/powerGapAnalysis';

interface PowerGapVisualizationProps {
  analysis: PowerGapAnalysis;
  onContinue?: () => void;
  onAdjust?: () => void;
}

export const PowerGapVisualization: React.FC<PowerGapVisualizationProps> = ({
  analysis,
  onContinue,
  onAdjust
}) => {
  
  // Calculate percentages for visual bars
  const maxPower = Math.max(analysis.neededPowerKW, analysis.selectedPowerKW);
  const neededPercent = (analysis.neededPowerKW / maxPower) * 100;
  const selectedPercent = (analysis.selectedPowerKW / maxPower) * 100;
  
  // Determine status color
  const getStatusColor = () => {
    if (analysis.recommendation === 'sufficient') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-800',
        bar: 'bg-green-500'
      };
    } else if (Math.abs(analysis.powerGapKW) < analysis.neededPowerKW * 0.1) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800',
        bar: 'bg-yellow-500'
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800',
        bar: 'bg-red-500'
      };
    }
  };
  
  const colors = getStatusColor();
  
  // Get icon for recommendation
  const getRecommendationIcon = () => {
    switch (analysis.recommendation) {
      case 'sufficient':
        return '✅';
      case 'add_power':
        return '⚡';
      case 'add_energy':
        return '🔋';
      case 'add_both':
        return '⚠️';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Power Gap Analysis
        </h2>
        <p className="text-gray-600">
          Intelligent assessment of your energy requirements
        </p>
      </div>

      {/* Main Analysis Card */}
      <div className={`border-2 rounded-xl p-6 ${colors.border} ${colors.bg}`}>
        
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${colors.badge}`}>
            {getRecommendationIcon()} {analysis.recommendation.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`text-sm font-medium ${colors.text}`}>
            Confidence: {analysis.confidenceLevel.toUpperCase()}
          </span>
        </div>

        {/* Power Comparison Bars */}
        <div className="space-y-4 mb-6">
          
          {/* Required Power */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Required Power</span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(analysis.neededPowerKW).toLocaleString()} kW
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${neededPercent}%` }}
              >
                <span className="text-xs text-white font-semibold">
                  {Math.round(analysis.neededPowerKW)} kW
                </span>
              </div>
            </div>
          </div>

          {/* Selected Power */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Current Configuration</span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(analysis.selectedPowerKW).toLocaleString()} kW
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`${colors.bar} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${selectedPercent}%` }}
              >
                <span className="text-xs text-white font-semibold">
                  {Math.round(analysis.selectedPowerKW)} kW
                </span>
              </div>
            </div>
          </div>

          {/* Gap Indicator */}
          <div className="pt-2 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Power Gap</span>
              <span className={`text-xl font-bold ${colors.text}`}>
                {analysis.powerGapKW > 0 ? '+' : ''}
                {Math.round(analysis.powerGapKW).toLocaleString()} kW
              </span>
            </div>
            {analysis.powerGapKW < 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Additional {Math.abs(Math.round(analysis.powerGapKW))} kW needed to meet requirements
              </p>
            )}
          </div>
        </div>

        {/* Energy Duration Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Energy Storage</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(analysis.selectedEnergyKWh).toLocaleString()} kWh
            </p>
            <p className="text-xs text-gray-600">
              ({Math.round(analysis.neededEnergyKWh).toLocaleString()} kWh needed)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Backup Duration</p>
            <p className="text-lg font-semibold text-gray-900">
              {analysis.selectedDurationHours} hrs
            </p>
            <p className="text-xs text-gray-600">
              ({analysis.neededDurationHours} hrs needed)
            </p>
          </div>
        </div>

        {/* Recommendation Text */}
        <div className={`p-4 rounded-lg border-l-4 ${colors.border} bg-white`}>
          <p className={`text-sm font-medium ${colors.text}`}>
            {analysis.recommendationText}
          </p>
        </div>
      </div>

      {/* Calculation Notes (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
          <span className="transform transition-transform group-open:rotate-90">▶</span>
          View calculation details ({analysis.calculationNotes.length} notes)
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          {analysis.calculationNotes.map((note, idx) => (
            <p key={idx} className="text-sm text-gray-700 font-mono">
              {note}
            </p>
          ))}
        </div>
      </details>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {analysis.recommendation !== 'sufficient' && onAdjust && (
          <button
            onClick={onAdjust}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold border-2 ${colors.border} ${colors.text} ${colors.bg} hover:opacity-80 transition-all`}
          >
            Adjust Configuration
          </button>
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Continue {analysis.recommendation === 'sufficient' ? '→' : 'Anyway →'}
          </button>
        )}
      </div>

      {/* Use Case Context */}
      <div className="text-center text-xs text-gray-500">
        Analysis for: <span className="font-semibold">{analysis.useCaseSlug.replace('-', ' ')}</span>
      </div>
    </div>
  );
};
