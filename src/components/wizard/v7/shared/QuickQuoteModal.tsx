/**
 * Quick Quote Modal — Custom System Size
 * 
 * For users who know their target system size.
 * Minimal inputs → instant quote.
 */

import React, { useState } from "react";
import { X, Zap, ArrowRight, Info } from "lucide-react";

interface QuickQuoteModalProps {
  onClose: () => void;
  onGenerate: (params: QuickQuoteParams) => void;
}

export interface QuickQuoteParams {
  mode: "custom" | "ballpark";
  systemSizeKW?: number;
  durationHours?: number;
  industry?: string;
  location?: string;
  electricityRate?: number;
}

export function QuickQuoteModal({ onClose, onGenerate }: QuickQuoteModalProps) {
  const [systemSizeKW, setSystemSizeKW] = useState<string>("1000");
  const [durationHours, setDurationHours] = useState<string>("4");
  const [industry, setIndustry] = useState<string>("office");
  const [location, setLocation] = useState<string>("CA");
  const [electricityRate, setElectricityRate] = useState<string>("0.15");

  const handleGenerate = () => {
    const params: QuickQuoteParams = {
      mode: "custom",
      systemSizeKW: parseFloat(systemSizeKW) || 1000,
      durationHours: parseFloat(durationHours) || 4,
      industry,
      location,
      electricityRate: parseFloat(electricityRate) || 0.15,
    };
    onGenerate(params);
  };

  const isValid = systemSizeKW && durationHours && parseFloat(systemSizeKW) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Quick Quote — Custom Size
              </h2>
              <p className="text-sm text-slate-600">
                Enter your target system size
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* System Size */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              System Power (kW) *
            </label>
            <input
              type="number"
              value={systemSizeKW}
              onChange={(e) => setSystemSizeKW(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000"
              min="1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Peak power capacity (e.g., 1000 kW = 1 MW)
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Storage Duration (hours) *
            </label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="4"
              min="0.5"
              step="0.5"
            />
            <p className="text-xs text-slate-500 mt-1">
              Storage capacity = Power × Duration (e.g., 1000 kW × 4 hrs = 4000 kWh)
            </p>
          </div>

          {/* Industry (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Industry (Optional)
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="office">Office Building</option>
              <option value="hotel">Hotel</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="data_center">Data Center</option>
              <option value="healthcare">Healthcare</option>
              <option value="car_wash">Car Wash</option>
              <option value="ev_charging">EV Charging</option>
              <option value="restaurant">Restaurant</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Location (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Location (Optional)
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="IL">Illinois</option>
              <option value="MA">Massachusetts</option>
              <option value="AZ">Arizona</option>
              <option value="NV">Nevada</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Electricity Rate (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Electricity Rate ($/kWh)
            </label>
            <input
              type="number"
              value={electricityRate}
              onChange={(e) => setElectricityRate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.15"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-slate-500 mt-1">
              Commercial average: $0.10-0.20/kWh
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Quick Quote Uses Regional Averages</p>
                <p className="text-blue-700">
                  For precise pricing based on your specific facility, use the guided wizard with detailed questions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!isValid}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            Generate Quote <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
