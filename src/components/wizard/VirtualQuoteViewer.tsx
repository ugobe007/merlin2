/**
 * VirtualQuoteViewer - Interactive Quote Progress Tracker
 * ======================================================
 * Floating UI component that shows current quote status and allows
 * users to review/modify their configuration at any time.
 */

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  Circle, 
  AlertCircle,
  Edit,
  Battery,
  Sun,
  Wind,
  MapPin,
  DollarSign,
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';
import { useQuote } from '../../contexts/QuoteContext';

interface VirtualQuoteViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStep?: (step: number) => void;
}

export const VirtualQuoteViewer: React.FC<VirtualQuoteViewerProps> = ({
  isOpen,
  onClose,
  onNavigateToStep
}) => {
  const { 
    quote, 
    completionPercentage, 
    isValid,
    validationErrors,
    validationWarnings 
  } = useQuote();

  if (!isOpen) return null;

  const sections = [
    {
      id: 1,
      title: 'Industry & Use Case',
      icon: FileText,
      step: 1,
      completed: !!quote.useCase.industry,
      data: {
        'Industry': quote.useCase.industryName || 'Not selected',
        'Baseline Power': quote.useCase.baseline.powerMW > 0 
          ? `${quote.useCase.baseline.powerMW.toFixed(2)} MW`
          : 'Not calculated',
        'Calculation': quote.useCase.baseline.calculatedFrom || 'Pending'
      }
    },
    {
      id: 2,
      title: 'Battery Configuration',
      icon: Battery,
      step: 3,
      completed: quote.configuration.battery.powerMW > 0,
      data: {
        'Power': `${quote.configuration.battery.powerMW.toFixed(2)} MW`,
        'Duration': `${quote.configuration.battery.durationHours} hours`,
        'Capacity': `${quote.configuration.battery.capacityMWh.toFixed(2)} MWh`,
        'Chemistry': quote.configuration.battery.chemistry
      }
    },
    {
      id: 3,
      title: 'Renewable Energy',
      icon: Sun,
      step: 4,
      completed: quote.configuration.renewables.solar.enabled ||
                 quote.configuration.renewables.wind.enabled ||
                 quote.configuration.renewables.generator.enabled,
      data: {
        'Solar': quote.configuration.renewables.solar.enabled 
          ? `${quote.configuration.renewables.solar.capacityMW.toFixed(2)} MW`
          : 'Not configured',
        'Wind': quote.configuration.renewables.wind.enabled
          ? `${quote.configuration.renewables.wind.capacityMW.toFixed(2)} MW`
          : 'Not configured',
        'Generator': quote.configuration.renewables.generator.enabled
          ? `${quote.configuration.renewables.generator.capacityMW.toFixed(2)} MW`
          : 'Not configured'
      }
    },
    {
      id: 4,
      title: 'Total System Power',
      icon: Zap,
      step: 4,
      completed: quote.configuration.totalSystemPowerMW > 0,
      data: {
        'Total Power': `${quote.configuration.totalSystemPowerMW.toFixed(2)} MW`,
        'Components': `Battery + Solar + Wind + Generator`
      }
    },
    {
      id: 5,
      title: 'Location & Rates',
      icon: MapPin,
      step: 5,
      completed: quote.location.electricityRate.energyChargePerKWh > 0,
      data: {
        'Energy Rate': `$${quote.location.electricityRate.energyChargePerKWh.toFixed(3)}/kWh`,
        'Demand Charge': `$${quote.location.electricityRate.demandChargePerKW.toFixed(2)}/kW`,
        'Utility': quote.location.electricityRate.utilityRateSource || 'Default',
        'State': quote.location.state || 'Not specified'
      }
    },
    {
      id: 6,
      title: 'Financial Analysis',
      icon: DollarSign,
      step: 6,
      completed: quote.financials.costs.totalProjectCost > 0,
      data: {
        'Project Cost': `$${(quote.financials.costs.totalProjectCost / 1000000).toFixed(2)}M`,
        'Annual Savings': `$${(quote.financials.savings.totalAnnualSavings / 1000).toFixed(0)}K`,
        'Payback': quote.financials.roi.paybackPeriod > 0 
          ? `${quote.financials.roi.paybackPeriod.toFixed(1)} years`
          : 'Not calculated',
        'ROI': quote.financials.roi.simpleROI > 0
          ? `${quote.financials.roi.simpleROI.toFixed(1)}%`
          : 'Not calculated'
      }
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Virtual Quote</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Quote Completion</span>
              <span className="font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Quote is valid and ready to review</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors.length} issue(s) to resolve</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Issues to Resolve</h3>
                  <ul className="space-y-1 text-sm text-red-800">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Warnings</h3>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {validationWarnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Quote Sections */}
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.id}
                className={`border rounded-lg p-5 transition-all ${
                  section.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {section.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600">
                        {section.completed ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  {onNavigateToStep && (
                    <button
                      onClick={() => onNavigateToStep(section.step)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                {/* Section Data */}
                <div className="ml-9 space-y-2">
                  {Object.entries(section.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quote Metadata */}
          <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Quote ID:</span>
              <span className="font-mono">{quote.id.slice(-12)}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>{quote.version}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date(quote.updatedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize font-semibold">{quote.status}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Floating Quote Button - Always visible in wizard
 */
interface FloatingQuoteButtonProps {
  onClick: () => void;
}

export const FloatingQuoteButton: React.FC<FloatingQuoteButtonProps> = ({ onClick }) => {
  const { completionPercentage, validationErrors } = useQuote();
  
  return (
    <button
      onClick={onClick}
      className="fixed top-20 right-6 z-30 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 font-semibold"
    >
      <FileText className="w-5 h-5" />
      <span>View Quote</span>
      
      {/* Completion Badge */}
      <div className="bg-white text-purple-600 px-2 py-1 rounded-full text-sm font-bold">
        {completionPercentage}%
      </div>
      
      {/* Error indicator */}
      {validationErrors.length > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
          {validationErrors.length}
        </div>
      )}
    </button>
  );
};
