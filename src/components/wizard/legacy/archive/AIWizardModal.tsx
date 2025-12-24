import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { formatPowerCompact } from '../../utils/powerFormatting';

/**
 * AI Wizard Modal Component
 * Displays AI-powered optimization suggestions for BESS configuration
 */

interface AIWizardModalProps {
  show: boolean;
  onClose: () => void;
  selectedTemplate: string;
  location: string;
  storageSizeMW: number;
  durationHours: number;
  costs: {
    totalProjectCost: number;
    annualSavings: number;
    paybackYears: number;
  };
  aiSuggestions: Array<{
    type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
    title: string;
    description: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
    savings?: string;
    action: () => void;
  }>;
  onContinue: () => void;
}

export const AIWizardModal: React.FC<AIWizardModalProps> = ({
  show,
  onClose,
  selectedTemplate,
  location,
  storageSizeMW,
  durationHours,
  costs,
  aiSuggestions,
  onContinue
}) => {
  if (!show) return null;

  const getIndustryName = (template: string): string => {
    const industryNames: { [key: string]: string } = {
      'manufacturing': 'Manufacturing',
      'office': 'Office Building',
      'datacenter': 'Data Center',
      'warehouse': 'Warehouse',
      'hotel': 'Hotel',
      'retail': 'Retail',
      'agriculture': 'Agriculture',
      'car-wash': 'Car Wash',
      'ev-charging': 'EV Charging',
      'apartment': 'Apartment Complex',
      'university': 'University',
      'indoor-farm': 'Indoor Farm',
      'hospital': 'Hospital',
      'cold-storage': 'Cold Storage'
    };
    return industryNames[template] || template;
  };

  const getSuggestionIcon = (type: string): string => {
    switch (type) {
      case 'optimization': return '⚡';
      case 'cost-saving': return '💰';
      case 'performance': return '🚀';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  };

  const getSuggestionColor = (type: string): string => {
    switch (type) {
      case 'optimization': return 'from-blue-500 to-cyan-500';
      case 'cost-saving': return 'from-green-500 to-emerald-500';
      case 'performance': return 'from-purple-500 to-pink-500';
      case 'warning': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-8 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold flex items-center gap-2">
                  AI Wizard
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Analyzing...</span>
                </h3>
                <p className="text-sm opacity-90 mt-1">I've analyzed your configuration and found optimization opportunities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors text-3xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8">
          {/* Industry & Use Case Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Optimizing for</div>
                <div className="text-3xl font-bold mb-2">{getIndustryName(selectedTemplate)}</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    🏢 {getIndustryName(selectedTemplate)} Operations
                  </span>
                  {location && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      📍 {location}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Current System</div>
                <div className="text-2xl font-bold">{formatPowerCompact(storageSizeMW)} / {durationHours}hr</div>
                <div className="text-sm">{(storageSizeMW * durationHours).toFixed(2)} MWh Total</div>
              </div>
            </div>
          </div>

          {/* Current Configuration Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              Financial Overview
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">${(costs.totalProjectCost / 1000000).toFixed(2)}M</div>
                <div className="text-xs text-gray-600 mt-1">Total Project Cost</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">${(costs.annualSavings / 1000).toFixed(0)}K</div>
                <div className="text-xs text-gray-600 mt-1">Annual Savings</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{costs.paybackYears.toFixed(1)} yrs</div>
                <div className="text-xs text-gray-600 mt-1">Payback Period</div>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                AI Recommendations ({aiSuggestions.length})
              </h4>

              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md overflow-hidden"
                >
                  {/* Suggestion Header */}
                  <div className={`bg-gradient-to-r ${getSuggestionColor(suggestion.type)} text-white p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getSuggestionIcon(suggestion.type)}</span>
                        <div>
                          <h5 className="font-bold text-lg">{suggestion.title}</h5>
                          <p className="text-sm opacity-90">{suggestion.description}</p>
                        </div>
                      </div>
                      {suggestion.savings && (
                        <div className="bg-white/20 px-4 py-2 rounded-xl">
                          <div className="text-xs opacity-90">Potential Savings</div>
                          <div className="font-bold text-lg">{suggestion.savings}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Current</div>
                        <div className="font-bold text-gray-900 text-lg">{suggestion.currentValue}</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Suggested</div>
                        <div className="font-bold text-green-600 text-lg">{suggestion.suggestedValue}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Impact</div>
                      <div className="text-gray-900">{suggestion.impact}</div>
                    </div>

                    <button
                      onClick={suggestion.action}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <span>Apply & Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center border-2 border-green-200">
              <div className="text-6xl mb-4">💰</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">Configuration Looks Great!</h4>
              <p className="text-gray-700 text-lg mb-4">
                Your current setup is well-optimized for <strong className="text-green-700">{getIndustryName(selectedTemplate)}</strong>
              </p>
              <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">System Size</div>
                    <div className="font-bold text-gray-900 text-lg">{formatPowerCompact(storageSizeMW)} / {durationHours}hr</div>
                    <div className="text-green-600">✓ Optimal</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Industry Focus</div>
                    <div className="font-bold text-gray-900 text-lg capitalize">{getIndustryName(selectedTemplate)}</div>
                    <div className="text-green-600">✓ Optimized</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Payback Period</div>
                    <div className="font-bold text-gray-900 text-lg">{costs.paybackYears.toFixed(1)} years</div>
                    <div className="text-green-600">✓ Competitive</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Continue with your configuration or use the adjustment tools above to see new AI recommendations.
              </p>
              <button
                onClick={onContinue}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <span>✓ Confirm Configuration & Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
            >
              Close & Keep Editing
            </button>
            {aiSuggestions.length > 0 && (
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <span>Skip Suggestions & Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
