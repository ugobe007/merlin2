/**
 * Step 5: Quote Summary
 * Clean rebuild for V3 architecture
 */

import React from 'react';
import { CheckCircle, Edit, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import type { BaseStepProps } from '@/types/wizard.types';

interface Step5Props extends BaseStepProps {
  quote: any;
  onEdit: (step: number) => void;
}

const Step5_QuoteSummary: React.FC<Step5Props> = ({
  quote,
  onEdit,
  onNext,
  onBack
}) => {
  // Log for debugging
  console.log('[Step5] Quote data:', quote);
  
  if (!quote || !quote.baseline) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Loading quote...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <h2 className="text-3xl font-bold text-gray-900">
            Your Quote is Ready
          </h2>
        </div>
        <p className="text-lg text-gray-600 mb-3">
          Review your customized battery storage system
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>💡 Ready to proceed:</strong> Review your configuration below. You can download the detailed quote or click Complete to finalize your project.
          </p>
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Battery Power</p>
            <p className="text-2xl font-bold text-gray-900">
              {quote.baseline?.powerMW || 0} MW
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Duration</p>
            <p className="text-2xl font-bold text-gray-900">
              {quote.baseline?.durationHrs || 0} hrs
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Energy</p>
            <p className="text-2xl font-bold text-gray-900">
              {((quote.baseline?.bessKwh || 0) / 1000).toFixed(2)} MWh
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Investment</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Battery System</span>
            <span className="font-semibold">{formatCurrency(quote.pricing?.batterySystem || 0)}</span>
          </div>
          {quote.pricing?.solarSystem > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Solar System</span>
              <span className="font-semibold">{formatCurrency(quote.pricing.solarSystem)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Installation</span>
            <span className="font-semibold">{formatCurrency(quote.pricing?.installation || 0)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Project Cost</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(quote.pricing?.totalProject || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Financial Returns</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Net Present Value</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(quote.financials?.npv || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Internal Rate of Return</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPercent(quote.financials?.irr || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Payback Period</p>
            <p className="text-2xl font-bold text-orange-600">
              {(quote.financials?.paybackYears || 0).toFixed(1)} years
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">10-Year ROI</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPercent(quote.financials?.roi10Year || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-3">Want to make changes?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEdit(2)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit Configuration
          </button>
          <button
            onClick={() => onEdit(3)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit Location
          </button>
        </div>
      </div>

      {/* Congratulations Banner */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 border-2 border-purple-300 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
          Congratulations!
        </h3>
        <p className="text-lg text-gray-700 mb-2">
          You've completed your first Power Profile and quote
        </p>
        <p className="text-xl font-semibold text-purple-600">
          Welcome to the Merlin Community! 🧙‍♂️
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 font-bold shadow-lg"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Quote & Join Community
        </button>
      </div>
    </div>
  );
};

export default Step5_QuoteSummary;
