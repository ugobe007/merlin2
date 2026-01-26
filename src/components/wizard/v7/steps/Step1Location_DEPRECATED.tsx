/**
 * Step 1: Location (Vineet's Design)
 * 
 * Features:
 * - 2-column layout (form + advisor)
 * - ZIP code, business name, street address
 * - "Find My Business" button
 * - Location Analysis (4 metrics)
 * - Weather Risk Assessment (15-item grid)
 * - MerlinAI Assessment (dynamic)
 */

import React, { useState } from 'react';
import AdvisorHeader from '../shared/AdvisorHeader';
import { TrueQuoteBadgeCanonical } from '@/components/shared/TrueQuoteBadgeCanonical';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';

interface Step1LocationProps {
  location: any;
  setLocation: (location: any) => void;
  industry: string | null;
  setIndustry: (industry: string | null) => void;
}

// Weather Risk Data (Simplified to 8 key risks)
const weatherRisks = [
  [
    { icon: '🌩️', level: 'Low', label: 'Storms', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
    { icon: '🌪️', level: 'Low', label: 'Tornado', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
    { icon: '🔥', level: 'High', label: 'Heat', color: '#ef4444', bg: 'linear-gradient(135deg,rgba(127,29,29,0.6),rgba(185,28,28,0.3))' },
    { icon: '❄️', level: 'Low', label: 'Winter', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
  ],
  [
    { icon: '🌊', level: 'Low', label: 'Flood', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
    { icon: '🏜️', level: 'Med', label: 'Drought', color: '#f59e0b', bg: 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' },
    { icon: '💨', level: 'Low', label: 'Wind', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
    { icon: '🔥', level: 'Med', label: 'Wildfire', color: '#f59e0b', bg: 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' },
  ],
];

// Location Metrics (hardcoded for demo)
const locationMetrics = [
  { label: 'Peak Sun', value: '6.4', unit: 'hrs/day', color: '#f59e0b' },
  { label: 'Electricity Rate', value: '$0.09', unit: 'per kWh', color: '#22c55e' },
  { label: 'Weather Risk', value: 'Low', unit: '', color: '#22c55e', highlight: true },
  { label: 'Solar Grade', value: 'A', unit: 'Excellent', color: '#f59e0b' },
];

export default function Step1Location({
  location,
  setLocation,
  industry,
  setIndustry,
}: Step1LocationProps) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  
  const handleInputChange = (field: string, value: string) => {
    setLocation({ ...location, [field]: value });
  };

  return (
    <div className="h-full flex">
      {/* LEFT SECTION: Form Inputs (55%) */}
      <div className="w-[55%] p-12 flex items-center justify-center border-r border-white/5">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <div className="text-6xl mb-5">🌎</div>
            <h2 className="text-3xl font-bold text-white mb-3">Your Location</h2>
            <p className="text-lg text-slate-400">Let's start with where you're located</p>
          </div>
      
          {/* Region Toggle */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex bg-white/5 rounded-xl p-1.5">
              <button
                onClick={() => handleInputChange('region', 'US')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  location?.region === 'US'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-lg">🇺🇸</span> United States
              </button>
              <button
                onClick={() => handleInputChange('region', 'Intl')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  location?.region === 'Intl'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-lg">🌐</span> International
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-6">

            {/* ZIP Code - Hero Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {location?.region === 'US' ? 'ZIP Code' : 'Postal Code'}
              </label>
              <input
                type="text"
                value={location?.zipCode || ''}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className="w-full px-6 py-5 bg-white/5 border-2 border-purple-500/30 rounded-xl text-4xl font-bold tracking-[12px] text-white placeholder-slate-500 focus:border-purple-500 focus:bg-white/10 transition-all text-center font-mono"
                placeholder={location?.region === 'US' ? '94102' : 'SW1A 1AA'}
                maxLength={location?.region === 'US' ? 5 : 10}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Business Name
              </label>
              <input
                type="text"
                value={location?.businessName || ''}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Street Address <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={location?.streetAddress || ''}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-base text-white placeholder-slate-500 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                placeholder="123 Main Street"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Wide Merlin Panel (45%) - Simplified layout */}
      <div className="w-[45%] flex flex-col bg-gradient-to-br from-slate-900/30 to-slate-950/50">
        {/* Header */}
        <div className="p-8 pb-0">
          <AdvisorHeader subtitle="Live Analysis" />
        </div>

        {/* Content - Simple padding approach with generous padding */}
        <div className="flex-1 flex items-center justify-center px-16 py-12 min-h-0">
          
          {/* Show welcome message if no ZIP or incomplete */}
          {(!location?.zipCode || location.zipCode.length < 5) ? (
            <div className="text-center max-w-md">
              {/* TrueQuote Badge */}
              <div className="mb-6">
                <TrueQuoteBadgeCanonical 
                  showTooltip={false}
                  onClick={() => setShowTrueQuoteModal(true)}
                />
              </div>
              
              <h3 className="text-2xl font-bold text-white leading-tight mb-6">
                Enter ZIP to load Live Analysis.
              </h3>
              
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                <p className="text-base text-slate-300 leading-relaxed">
                  <span className="font-semibold text-purple-400">Step 1:</span> Enter your location so I can recommend the best solution
                </p>
              </div>
            </div>
          ) : (
            /* Show location analysis when ZIP is entered */
            <div className="w-full max-w-md space-y-6">
              {/* Location Analysis */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔍</span>
                  <span className="text-base font-semibold text-white">Location Analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {locationMetrics.map((metric, i) => (
                    <div 
                      key={i} 
                      className={`${
                        metric.highlight 
                          ? 'bg-green-500/10 border-green-500/25' 
                          : 'bg-white/5 border-white/10'
                      } border-2 rounded-lg p-6 text-center`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wide">{metric.label}</div>
                      <div className="text-xl font-bold" style={{ color: metric.color }}>
                        {metric.value}
                      </div>
                      {metric.unit && <div className="text-[10px] text-slate-400 mt-0.5">{metric.unit}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Risk */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌤️</span>
                    <span className="text-base font-semibold text-white">Weather Risk</span>
                  </div>
                  <span className="text-xl font-bold text-green-400">Low</span>
                </div>
                <div className="bg-green-500/5 border-2 border-green-500/20 rounded-lg p-6">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Minimal weather concerns. Excellent conditions for solar + storage deployment.
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <span className="text-base font-semibold text-white">Recommendation</span>
                </div>
                <div 
                  className="bg-gradient-to-br from-purple-600/10 to-purple-800/5 border-2 border-purple-500/30 rounded-xl p-8"
                  style={{ animation: 'pulsate 2s ease-in-out infinite' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-300">Optimal System</span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-green-500 to-green-600">
                      BESS + Solar
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Based on your location's solar conditions and rates, pairing battery storage with solar will maximize ROI.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* TrueQuote Info Modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
      />
    </div>
  );
}

// Assessment Row Component
function AssessmentRow({ 
  icon, 
  label, 
  value, 
  valueStyle, 
  isLast = false 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  valueStyle?: any; 
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${!isLast ? 'border-b border-white/10' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-white">{label}</span>
      </div>
      <span 
        className="text-xs font-semibold px-3 py-1 rounded-md"
        style={{ 
          color: valueStyle?.color || '#22c55e', 
          background: valueStyle?.bg || 'rgba(34,197,94,0.15)' 
        }}
      >
        {value}
      </span>
    </div>
  );
}
