/**
 * Live Calculation Panel
 * 
 * Shows real-time BESS sizing as user answers questions
 * Updates immediately on every answer change
 */

import React from 'react';
import { Zap, Battery, TrendingUp } from 'lucide-react';
import PowerGauge from './PowerGauge';
import SavingsCounter from './SavingsCounter';

interface LiveCalculationPanelProps {
  livePreview: any;
}

export default function LiveCalculationPanel({ livePreview }: LiveCalculationPanelProps) {
  
  if (!livePreview) {
    return (
      <div className="sticky top-8">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="text-center text-gray-500">
            <Battery className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Answer questions to see your<br />energy profile take shape
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { peakKW, bessKWh, bessMW, confidence, estimatedSavings } = livePreview;

  return (
    <div className="sticky top-8 space-y-4">
      
      {/* Main Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-4 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Live Calculation
        </h3>

        {/* Power Gauge */}
        <PowerGauge peakKW={peakKW} />

        {/* Key Metrics */}
        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Peak Demand</span>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(peakKW)} kW
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">BESS Size</span>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(bessKWh)} kWh
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Power Rating</span>
            <span className="text-lg font-bold text-gray-900">
              {bessMW.toFixed(2)} MW
            </span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-blue-200">
            <span className="text-sm text-gray-600">Confidence</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-green-600">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Preview */}
      {estimatedSavings && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Estimated Savings
          </h3>
          <SavingsCounter amount={estimatedSavings.annualSavings} />
        </div>
      )}

    </div>
  );
}
