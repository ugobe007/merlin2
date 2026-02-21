/**
 * Quick Quote Modal — Custom System Size
 * 
 * ProQuote manual entry mode
 * Merlin design: Dark theme, emerald accents, clean inputs
 */

import React, { useState } from "react";
import { X, Zap, ArrowRight, Sparkles } from "lucide-react";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">
                  ProQuote™
                </h2>
                <img 
                  src={badgeProQuoteIcon} 
                  alt="ProQuote" 
                  className="w-7 h-7 object-contain"
                />
              </div>
              <p className="text-sm text-slate-400">
                Enter your target system specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* System Size */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              System Power (kW) *
            </label>
            <input
              type="number"
              value={systemSizeKW}
              onChange={(e) => setSystemSizeKW(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
              placeholder="1000"
              min="1"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Peak power capacity (e.g., 1000 kW = 1 MW)
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Storage Duration (hours) *
            </label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
              placeholder="4"
              min="0.5"
              step="0.5"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Storage capacity = Power × Duration (e.g., 1000 kW × 4 hrs = 4000 kWh)
            </p>
          </div>

          {/* Industry (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Industry (Optional)
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-semibold text-white mb-2">
              Location (Optional)
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-semibold text-white mb-2">
              Electricity Rate ($/kWh)
            </label>
            <input
              type="number"
              value={electricityRate}
              onChange={(e) => setElectricityRate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
              placeholder="0.15"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Commercial average: $0.10-0.20/kWh
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-blue-400 mb-1">TrueQuote™ Powered</p>
                <p className="text-slate-400">
                  All calculations source-verified. Need more precision? Use the guided wizard for facility-specific analysis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!isValid}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            Generate Quote <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
