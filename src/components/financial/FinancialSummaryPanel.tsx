import React from 'react';

interface FinancialSummaryPanelProps {
  // Currency and financial data
  currency: string;
  setCurrency: (currency: string) => void;
  bessCapEx: number;
  grandCapEx: number;
  annualSavings: number;
  roiYears: number;
  currentQuoteStatus: string;

  // Display functions  
  getCurrencySymbol: () => string;
  convertCurrency: (amount: number) => number;
  
  // Event handlers
  handleExportWord: () => void;
  setShowCalculationModal: (show: boolean) => void;
  handleExportCalculations: () => void;
  setShowAnalytics: (show: boolean) => void;
  setShowFinancing: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setShowUtilityRates: (show: boolean) => void;
  setShowQuoteTemplates: (show: boolean) => void;
  setShowPricingPresets: (show: boolean) => void;
  setShowReviewWorkflow: (show: boolean) => void;
}

export default function FinancialSummaryPanel({
  currency,
  setCurrency,
  bessCapEx,
  grandCapEx,
  annualSavings,
  roiYears,
  currentQuoteStatus,
  getCurrencySymbol,
  convertCurrency,
  handleExportWord,
  setShowCalculationModal,
  handleExportCalculations,
  setShowAnalytics,
  setShowFinancing,
  setShowTemplates,
  setShowUtilityRates,
  setShowQuoteTemplates,
  setShowPricingPresets,
  setShowReviewWorkflow,
}: FinancialSummaryPanelProps) {
  return (
    <section className="rounded-2xl p-8 shadow-2xl border-2 border-green-300 bg-gradient-to-b from-green-50 to-white relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-green-800 mb-8">Financial Summary</h2>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-4 py-2 bg-white border-2 border-green-400 rounded-xl text-gray-800 font-bold focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-300 shadow-md"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="CNY">CNY (¥)</option>
          <option value="CAD">CAD (C$)</option>
          <option value="AUD">AUD (A$)</option>
          <option value="INR">INR (₹)</option>
          <option value="BRL">BRL (R$)</option>
          <option value="MXN">MXN (MX$)</option>
          <option value="KRW">KRW (₩)</option>
        </select>
      </div>
      <div className="space-y-3">
        <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-lg">BESS CapEx:</span>
          <span className="font-bold text-green-700 text-2xl">{getCurrencySymbol()}{convertCurrency(bessCapEx).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300 flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-lg">Grand CapEx:</span>
          <span className="font-bold text-green-800 text-2xl">{getCurrencySymbol()}{convertCurrency(grandCapEx).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <hr className="border-green-300 my-4" />
        <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-lg">Annual Savings:</span>
          <span className="font-bold text-yellow-700 text-2xl">{getCurrencySymbol()}{convertCurrency(annualSavings).toLocaleString(undefined, {maximumFractionDigits: 0})}/yr</span>
        </div>
        <div className="bg-yellow-100 p-4 rounded-xl border-2 border-yellow-300 flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-lg">Simple ROI:</span>
          <span className="font-bold text-orange-700 text-2xl">{roiYears.toFixed(2)} years</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <button 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-green-400/30"
          onClick={handleExportWord}
        >
          📄 Export to Word
        </button>
        <button 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-blue-400/30"
          onClick={() => setShowCalculationModal(true)}
          title="View detailed formulas and assumptions"
        >
          🧮 View Calculation Details
        </button>
        <button 
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-purple-400/30"
          onClick={handleExportCalculations}
          title="Export detailed formulas to text file"
        >
          💾 Export Formulas (TXT)
        </button>
        <div className="mt-6 pt-6 border-t-2 border-green-200">
          <p className="text-sm text-gray-600 font-semibold mb-3 text-center">Advanced Tools</p>
          <div className="space-y-3">
            <button 
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-cyan-400/30"
              onClick={() => setShowAnalytics(true)}
              title="NPV, IRR, ROI, and sensitivity analysis"
            >
              📊 Advanced Analytics
            </button>
            <button 
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-emerald-400/30"
              onClick={() => setShowFinancing(true)}
              title="Compare loan, lease, and PPA options"
            >
              💰 Financing Calculator
            </button>
            <button 
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-violet-400/30"
              onClick={() => setShowTemplates(true)}
              title="Pre-configured BESS templates for common use cases"
            >
              📋 Use Case Templates
            </button>
          </div>
        </div>

        {/* Quote Customization Section */}
        <div className="mt-6 pt-6 border-t-2 border-blue-200">
          <p className="text-sm text-gray-600 font-semibold mb-3 text-center">Quote Customization</p>
          <div className="space-y-3">
            <button 
              className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-sky-300/30"
              onClick={() => setShowUtilityRates(true)}
              title="Select regional utility rates for accurate pricing"
            >
              ⚡ Regional Utility Rates
            </button>
            <button 
              className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-gray-300/30"
              onClick={() => setShowQuoteTemplates(true)}
              title="Customize quote templates for different project types"
            >
              📋 Quote Templates
            </button>
            <button 
              className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-gray-300/30"
              onClick={() => setShowPricingPresets(true)}
              title="Save your pricing presets & EPC contractor fees"
            >
              ⚙️ My Pricing Presets
            </button>
            <button 
              className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all duration-200 border border-purple-400/30 relative"
              onClick={() => setShowReviewWorkflow(true)}
              title="Manage quote review and approval workflow"
            >
              <span>✓ Review Workflow</span>
              {currentQuoteStatus !== 'draft' && (
                <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded capitalize">
                  {currentQuoteStatus}
                </span>
              )}
              {currentQuoteStatus === 'in-review' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
              {currentQuoteStatus === 'approved' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}