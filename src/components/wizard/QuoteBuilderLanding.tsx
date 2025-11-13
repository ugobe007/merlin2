import React, { useState, useEffect, useRef } from 'react';
import { Building2, Zap, DollarSign, Calendar, TrendingUp, ArrowRight, Edit, CheckCircle } from 'lucide-react';
import merlinLogo from '../../assets/images/new_Merlin.png';

interface UseCaseData {
  id: string;
  industry: string;
  icon: string;
  description: string;
  facilitySize: string;
  peakPowerKW: number;
  avgPowerKW: number;
  dailyEnergyKWh: number;
  operatingHours: string;
  systemSizeMW: number;
  systemSizeMWh: number;
  duration: number;
  demandChargeBefore: number;
  demandChargeAfter: number;
  energyCostBefore: number;
  energyCostAfter: number;
  totalAnnualSavings: number;
  systemCost: number;
  paybackYears: number;
  roi25Year: string;
  keyBenefit1: string;
  keyBenefit2: string;
  keyBenefit3: string;
}

interface QuoteBuilderLandingProps {
  useCase: UseCaseData;
  onGenerateQuote: () => void;
  onCustomize: () => void;
  onCancel: () => void;
}

const QuoteBuilderLanding: React.FC<QuoteBuilderLandingProps> = ({
  useCase,
  onGenerateQuote,
  onCustomize,
  onCancel
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [quoteName, setQuoteName] = useState(`${useCase.industry} BESS Quote`);
  const [customerName, setCustomerName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleQuickGenerate = () => {
    // Generate quote with default values
    onGenerateQuote();
  };

  const handleCustomizeGenerate = () => {
    // Open wizard for customization
    onCustomize();
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-8 rounded-t-2xl relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Company Logo */}
          <div className="absolute top-4 left-4 z-10">
            <img 
              src={merlinLogo} 
              alt="Merlin Energy" 
              className="h-12 object-contain bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex items-center gap-4 mb-4 mt-8">
            <span className="text-6xl">{useCase.icon}</span>
            <div>
              <h2 className="text-3xl font-bold">Build Your Quote</h2>
              <p className="text-blue-100 text-lg">{useCase.industry}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Use Case Overview */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Facility Overview
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <p className="text-gray-700 mb-4">{useCase.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Facility Size</div>
                  <div className="text-lg font-bold text-gray-900">{useCase.facilitySize}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Peak Power</div>
                  <div className="text-lg font-bold text-gray-900">{useCase.peakPowerKW.toLocaleString()} kW</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Daily Energy</div>
                  <div className="text-lg font-bold text-gray-900">{useCase.dailyEnergyKWh.toLocaleString()} kWh</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Operating Hours</div>
                  <div className="text-lg font-bold text-gray-900">{useCase.operatingHours}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended System */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              Recommended System Configuration
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300">
                <div className="text-blue-700 font-semibold mb-2">Power Capacity</div>
                <div className="text-3xl font-bold text-blue-900">{useCase.systemSizeMW} MW</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                <div className="text-purple-700 font-semibold mb-2">Energy Storage</div>
                <div className="text-3xl font-bold text-purple-900">{useCase.systemSizeMWh} MWh</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
                <div className="text-green-700 font-semibold mb-2">Duration</div>
                <div className="text-3xl font-bold text-green-900">{useCase.duration} hours</div>
              </div>
            </div>

            {/* Electrical Configuration */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4">Electrical Configuration</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Voltage</div>
                  <div className="text-lg font-bold text-gray-900">480V AC</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amperage</div>
                  <div className="text-lg font-bold text-gray-900">{Math.round((useCase.systemSizeMW * 1000000) / (480 * 1.732))} A</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">PCS (Inverter)</div>
                  <div className="text-lg font-bold text-gray-900">{useCase.systemSizeMW} MW</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Configuration</div>
                  <div className="text-lg font-bold text-gray-900">3-Phase</div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Financial Overview
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-green-700 font-semibold mb-2">Annual Savings</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(useCase.totalAnnualSavings)}</div>
                </div>
                <div>
                  <div className="text-green-700 font-semibold mb-2">Payback Period</div>
                  <div className="text-2xl font-bold text-green-900">{useCase.paybackYears.toFixed(1)} years</div>
                </div>
                <div>
                  <div className="text-green-700 font-semibold mb-2">25-Year ROI</div>
                  <div className="text-2xl font-bold text-green-900">{useCase.roi25Year}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t-2 border-green-200">
                <div className="text-green-700 font-semibold mb-2">Estimated System Cost</div>
                <div className="text-3xl font-bold text-green-900">{formatCurrency(useCase.systemCost)}</div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              Key Benefits
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{useCase.keyBenefit1}</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{useCase.keyBenefit2}</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-800">{useCase.keyBenefit3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Customization Fields */}
          {isCustomizing && (
            <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-6 h-6 text-purple-600" />
                Customize Quote Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quote Name
                  </label>
                  <input
                    type="text"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      placeholder="Enter project location"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Primary Action - Quick Generate */}
            <button
              onClick={handleQuickGenerate}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              <TrendingUp className="w-6 h-6" />
              Generate Quote Now
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Secondary Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-6 py-3 rounded-xl font-semibold transition-colors border-2 border-purple-300 flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                {isCustomizing ? 'Hide' : 'Add'} Quote Details
              </button>
              <button
                onClick={handleCustomizeGenerate}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-6 py-3 rounded-xl font-semibold transition-colors border-2 border-blue-300 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Customize System First
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteBuilderLanding;
