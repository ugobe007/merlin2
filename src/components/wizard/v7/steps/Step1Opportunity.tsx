/**
 * Step 1: Opportunity Cards
 * 
 * Show ROI and savings potential BEFORE asking questions
 * 
 * Vineet's Vision: Lead with value, not questions
 */

import React from 'react';
import { TrendingUp, DollarSign, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

interface Step1OpportunityProps {
  industry: string | null;
  opportunityData: any;
  onNext: () => void;
  onBack: () => void;
}

export default function Step1Opportunity({
  industry,
  opportunityData,
  onNext,
  onBack,
}: Step1OpportunityProps) {
  
  if (!opportunityData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading opportunity data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {opportunityData.title}
        </h1>
        <p className="text-lg text-gray-600">
          Here's what battery energy storage can do for you
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Annual Savings Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-700">Estimated Annual Savings</div>
              <div className="text-3xl font-bold text-green-900">
                {opportunityData.estimatedAnnualSavings}
              </div>
            </div>
          </div>
          <p className="text-sm text-green-700">
            Through peak demand reduction and energy arbitrage
          </p>
        </div>

        {/* Payback Period Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-700">Payback Period</div>
              <div className="text-3xl font-bold text-blue-900">
                {opportunityData.paybackPeriod}
              </div>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Industry-leading ROI with ITC tax credits
          </p>
        </div>

      </div>

      {/* Insights */}
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900">Key Insights</h3>
        </div>
        <ul className="space-y-3">
          {opportunityData.insights.map((insight: string, index: number) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-sm text-purple-900">{insight}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-2">Ready to Get Your Custom Quote?</h3>
        <p className="text-blue-100 mb-6">
          I'll need about 16 details to size your perfect energy storage system
        </p>
        <button
          onClick={onNext}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-flex items-center space-x-2"
        >
          <span>Let's Do It!</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

    </div>
  );
}
