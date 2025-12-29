/**
 * Quote Review Modal
 * Shows comprehensive quote details before allowing download
 */

import React from 'react';
import { X, Zap, DollarSign, TrendingUp, Calendar, Sun, Battery } from 'lucide-react';

interface QuoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  
  // System specs
  storageSizeMW: number;
  durationHours: number;
  energyCapacity: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  
  // Costs
  equipmentCost: number;
  installationCost: number;
  totalProjectCost: number;
  federalTaxCredit: number;
  netCost: number;
  
  // Financial metrics
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  roi25Year?: number;
  npv?: number;
  irr?: number;
  
  // Location & template
  location?: string;
  industryName?: string;
}

const QuoteReviewModal: React.FC<QuoteReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  storageSizeMW,
  durationHours,
  energyCapacity,
  solarMW = 0,
  windMW = 0,
  generatorMW = 0,
  equipmentCost,
  installationCost,
  totalProjectCost,
  federalTaxCredit,
  netCost,
  annualSavings,
  paybackYears,
  roi10Year,
  roi25Year,
  npv,
  irr,
  location,
  industryName
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Review Your Quote</h2>
              <p className="text-blue-100 text-sm mt-1">
                Please review the details before downloading
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Industry & Location */}
            {(industryName || location) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {industryName && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Industry</p>
                      <p className="font-semibold text-gray-900">{industryName}</p>
                    </div>
                  )}
                  {location && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold text-gray-900">{location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Configuration */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Battery className="w-5 h-5 text-blue-600" />
                System Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Power Capacity</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {storageSizeMW.toFixed(2)} MW
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Duration</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {durationHours.toFixed(1)} hrs
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Energy Storage</p>
                  <p className="text-2xl font-bold text-green-900">
                    {energyCapacity.toFixed(2)} MWh
                  </p>
                </div>
                {solarMW > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium flex items-center gap-1">
                      <Sun className="w-4 h-4" />
                      Solar
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {solarMW.toFixed(2)} MW
                    </p>
                  </div>
                )}
                {windMW > 0 && (
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-cyan-600 font-medium flex items-center gap-1">
                      💨 Wind
                    </p>
                    <p className="text-2xl font-bold text-cyan-900">
                      {windMW.toFixed(2)} MW
                    </p>
                  </div>
                )}
                {generatorMW > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                      ⚡ Generator
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {generatorMW.toFixed(2)} MW
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Cost Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Equipment Cost</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(equipmentCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Installation Cost</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(installationCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-blue-900 font-medium">Total Project Cost</span>
                  <span className="font-bold text-blue-900 text-xl">{formatCurrency(totalProjectCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700">Federal Tax Credit (30%)</span>
                  <span className="font-semibold text-green-900">-{formatCurrency(federalTaxCredit)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <span className="text-white font-bold text-lg">Net Cost (After Credits)</span>
                  <span className="font-bold text-white text-2xl">{formatCurrency(netCost)}</span>
                </div>
              </div>
            </div>

            {/* Financial Performance */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Financial Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-purple-600 font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Payback Period
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {paybackYears.toFixed(1)} years
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Annual Savings</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(annualSavings)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">10-Year ROI</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPercent(roi10Year)}
                  </p>
                </div>
                {roi25Year !== undefined && roi25Year > 0 && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">25-Year ROI</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {formatPercent(roi25Year)}
                    </p>
                  </div>
                )}
                {npv !== undefined && npv !== 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Net Present Value</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(npv)}
                    </p>
                  </div>
                )}
                {irr !== undefined && irr !== 0 && (
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <p className="text-sm text-teal-600 font-medium">Internal Rate of Return</p>
                    <p className="text-2xl font-bold text-teal-900">
                      {formatPercent(irr)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 25-Year Savings Projection */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-bold text-gray-900">25-Year Total Savings</h4>
              </div>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {formatCurrency(annualSavings * 25)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Based on {formatCurrency(annualSavings)} annual savings over 25 years
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Back to Edit
            </button>
            <button
              onClick={onConfirm}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Looks Good - Proceed to Download →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteReviewModal;
