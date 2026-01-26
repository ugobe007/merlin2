/**
 * Step 4: Final Results + Export
 * 
 * Show complete quote with export options
 */

import React from 'react';
import { Download, FileText, ArrowLeft } from 'lucide-react';

interface Step4ResultsProps {
  quote: any;
  exportQuote: (format: 'pdf' | 'word' | 'excel') => void;
  onBack: () => void;
}

export default function Step4Results({
  quote,
  exportQuote,
  onBack,
}: Step4ResultsProps) {
  
  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Generating quote...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Quote is Ready!
        </h1>
        <p className="text-lg text-gray-600">
          Download or share your custom energy storage proposal
        </p>
      </div>

      {/* Quote Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">BESS Size</div>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(quote.bessKWh)} kWh
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
            <div className="text-3xl font-bold text-green-600">
              ${quote.estimatedSavings?.annualSavings.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Confidence</div>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(quote.confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Export Your Quote
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => exportQuote('pdf')}
            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="font-medium text-gray-900">PDF</div>
            <div className="text-xs text-gray-500">Printable document</div>
          </button>

          <button
            onClick={() => exportQuote('word')}
            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="font-medium text-gray-900">Word</div>
            <div className="text-xs text-gray-500">Editable proposal</div>
          </button>

          <button
            onClick={() => exportQuote('excel')}
            className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="font-medium text-gray-900">Excel</div>
            <div className="text-xs text-gray-500">Financial model</div>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Configuration</span>
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Start New Quote
        </button>
      </div>

    </div>
  );
}
