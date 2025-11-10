import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Settings, DollarSign } from 'lucide-react';

// Import UseCaseData interface from UseCaseROI
interface UseCaseData {
  id: string;
  industry: string;
  icon: string;
  image?: string;
  description: string;
  facilitySize: string;
  
  // Load Profile
  peakPowerKW: number;
  avgPowerKW: number;
  dailyEnergyKWh: number;
  operatingHours: string;
  
  // BESS Solution
  systemSizeMW: number;
  systemSizeMWh: number;
  duration: number;
  
  // Financial Data
  demandChargeBefore: number;
  demandChargeAfter: number;
  energyCostBefore: number;
  energyCostAfter: number;
  
  // ROI Metrics
  totalAnnualSavings: number;
  systemCost: number;
  paybackYears: number;
  roi25Year: string;
  
  // Key Benefits
  keyBenefit1: string;
  keyBenefit2: string;
  keyBenefit3: string;
}

interface PowerAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  useCase: UseCaseData | null;
  onConfirm: (adjustedUseCase: UseCaseData) => void;
}

export default function PowerAdjustmentModal({ 
  isOpen, 
  onClose, 
  useCase, 
  onConfirm 
}: PowerAdjustmentModalProps) {
  // State for adjusted parameters
  const [adjustedParams, setAdjustedParams] = useState<UseCaseData | null>(null);
  
  // Initialize with use case data when modal opens
  useEffect(() => {
    if (isOpen && useCase) {
      setAdjustedParams({ ...useCase });
    }
  }, [isOpen, useCase]);

  if (!isOpen || !useCase || !adjustedParams) return null;

  const handleParameterChange = (field: keyof UseCaseData, value: number) => {
    if (!adjustedParams) return;
    
    const updated = { ...adjustedParams, [field]: value };
    
    // Auto-calculate related parameters when key values change
    if (field === 'systemSizeMW') {
      // Update MWh based on duration
      updated.systemSizeMWh = value * updated.duration;
      // Update system cost proportionally
      const costRatio = value / useCase.systemSizeMW;
      updated.systemCost = useCase.systemCost * costRatio;
    } else if (field === 'duration') {
      // Update MWh based on power rating
      updated.systemSizeMWh = updated.systemSizeMW * value;
      // Update system cost proportionally
      const costRatio = value / useCase.duration;
      updated.systemCost = useCase.systemCost * costRatio;
    } else if (field === 'systemSizeMWh') {
      // Update duration based on power rating
      updated.duration = value / updated.systemSizeMW;
    }
    
    // Recalculate savings and payback based on system size changes
    if (field === 'systemSizeMW' || field === 'duration' || field === 'systemSizeMWh') {
      const sizeRatio = updated.systemSizeMW / useCase.systemSizeMW;
      updated.totalAnnualSavings = Math.round(useCase.totalAnnualSavings * sizeRatio);
      updated.paybackYears = updated.systemCost / updated.totalAnnualSavings;
    }
    
    setAdjustedParams(updated);
  };

  const handleConfirm = () => {
    if (adjustedParams) {
      onConfirm(adjustedParams);
      onClose();
    }
  };

  const inputStyle = "w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium bg-blue-50";
  const labelStyle = "block text-sm font-semibold text-gray-800 mb-2";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{useCase.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">Customize Your {useCase.industry} System</h2>
                <p className="text-blue-100">Adjust power requirements to match your specific needs</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold hover:bg-white/20 rounded-lg p-2 transition-all"
            >×</button>
          </div>
        </div>

        <div className="p-8">
          {/* Current vs Adjusted Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Original Template */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">📋</span>
                Original Template
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">System Power:</span>
                  <span className="font-bold text-gray-900">{useCase.systemSizeMW.toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duration:</span>
                  <span className="font-bold text-gray-900">{useCase.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Energy Capacity:</span>
                  <span className="font-bold text-gray-900">{useCase.systemSizeMWh.toFixed(1)} MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Annual Savings:</span>
                  <span className="font-bold text-green-600">${(useCase.totalAnnualSavings / 1000).toLocaleString()}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">System Cost:</span>
                  <span className="font-bold text-blue-600">${(useCase.systemCost / 1000).toLocaleString()}K</span>
                </div>
              </div>
            </div>

            {/* Adjusted Parameters */}
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="text-purple-600">⚙️</span>
                Your Customized System
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">System Power:</span>
                  <span className="font-bold text-purple-900">{adjustedParams.systemSizeMW.toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duration:</span>
                  <span className="font-bold text-purple-900">{adjustedParams.duration.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Energy Capacity:</span>
                  <span className="font-bold text-purple-900">{adjustedParams.systemSizeMWh.toFixed(1)} MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Annual Savings:</span>
                  <span className="font-bold text-green-600">${(adjustedParams.totalAnnualSavings / 1000).toLocaleString()}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">System Cost:</span>
                  <span className="font-bold text-blue-600">${(adjustedParams.systemCost / 1000).toLocaleString()}K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adjustment Controls */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="text-blue-600" size={24} />
              Adjust System Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Power Rating */}
              <div>
                <label className={labelStyle}>
                  <Zap className="inline w-4 h-4 mr-2 text-yellow-600" />
                  System Power (MW)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={adjustedParams.systemSizeMW}
                  onChange={(e) => handleParameterChange('systemSizeMW', parseFloat(e.target.value) || 0)}
                  className={inputStyle}
                />
                <p className="text-xs text-gray-600 mt-1">Maximum discharge power rating</p>
              </div>

              {/* Duration */}
              <div>
                <label className={labelStyle}>
                  <TrendingUp className="inline w-4 h-4 mr-2 text-purple-600" />
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={adjustedParams.duration}
                  onChange={(e) => handleParameterChange('duration', parseFloat(e.target.value) || 0)}
                  className={inputStyle}
                />
                <p className="text-xs text-gray-600 mt-1">Hours of full-power discharge</p>
              </div>

              {/* Energy Capacity */}
              <div>
                <label className={labelStyle}>
                  <DollarSign className="inline w-4 h-4 mr-2 text-green-600" />
                  Energy Capacity (MWh)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="400"
                  step="0.5"
                  value={adjustedParams.systemSizeMWh}
                  onChange={(e) => handleParameterChange('systemSizeMWh', parseFloat(e.target.value) || 0)}
                  className={inputStyle}
                />
                <p className="text-xs text-gray-600 mt-1">Total energy storage capacity</p>
              </div>
            </div>

            {/* Load Profile Adjustments */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Facility Load Profile (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelStyle}>Peak Power (kW)</label>
                  <input
                    type="number"
                    min="50"
                    max="50000"
                    step="50"
                    value={adjustedParams.peakPowerKW}
                    onChange={(e) => handleParameterChange('peakPowerKW', parseInt(e.target.value) || 0)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Average Power (kW)</label>
                  <input
                    type="number"
                    min="25"
                    max="25000"
                    step="25"
                    value={adjustedParams.avgPowerKW}
                    onChange={(e) => handleParameterChange('avgPowerKW', parseInt(e.target.value) || 0)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Daily Energy (kWh)</label>
                  <input
                    type="number"
                    min="500"
                    max="500000"
                    step="500"
                    value={adjustedParams.dailyEnergyKWh}
                    onChange={(e) => handleParameterChange('dailyEnergyKWh', parseInt(e.target.value) || 0)}
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Impact of Your Changes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((adjustedParams.totalAnnualSavings - useCase.totalAnnualSavings) / 1000) > 0 ? '+' : ''}
                  ${((adjustedParams.totalAnnualSavings - useCase.totalAnnualSavings) / 1000).toLocaleString()}K
                </div>
                <div className="text-sm text-gray-600">Annual Savings Change</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {adjustedParams.paybackYears < 1 
                    ? `${(adjustedParams.paybackYears * 12).toFixed(1)} mo`
                    : `${adjustedParams.paybackYears.toFixed(1)} yr`
                  }
                </div>
                <div className="text-sm text-gray-600">New Payback Period</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {((adjustedParams.systemSizeMW / useCase.systemSizeMW - 1) * 100) > 0 ? '+' : ''}
                  {((adjustedParams.systemSizeMW / useCase.systemSizeMW - 1) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">System Size Change</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🚀</span>
              <div>
                <div className="text-lg">Build Custom Quote</div>
                <div className="text-sm opacity-90">With your adjustments</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}