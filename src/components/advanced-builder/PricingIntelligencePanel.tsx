import React from 'react';
import { TrendingUp, Battery, Sparkles } from 'lucide-react';
import { BESS_PRICING_TIERS, VOLUME_DISCOUNTS } from '../../utils/advancedBuilderConstants';

/**
 * BESS Market Pricing Intelligence Panel
 * 
 * Displays Q4 2025 realistic installed costs with volume discounts.
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.3)
 */

export function PricingIntelligencePanel() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8">
      <div className="bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-cyan-600/20 backdrop-blur-xl border-2 border-emerald-400/30 rounded-2xl p-6 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">BESS Market Pricing Intelligence</h3>
              <p className="text-sm text-emerald-200">Real-time installed costs (Q4 2025)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">Last Updated</p>
            <p className="text-sm font-bold text-white">Nov 2025</p>
          </div>
        </div>
        
        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BESS_PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`bg-gradient-to-br ${tier.color} backdrop-blur-sm border ${tier.borderColor} rounded-xl p-4 hover:scale-105 transition-transform duration-300 ${tier.highlight ? 'ring-2 ring-green-400/20' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={`text-xs ${tier.textColor} font-semibold mb-1 flex items-center gap-1`}>
                    {tier.name}
                    {tier.highlight && <Sparkles className="w-3 h-3 text-green-300" />}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ${tier.pricePerKwh}
                    <span className={`text-lg ${tier.textColor}`}>/kWh</span>
                  </p>
                </div>
                <div className={`${tier.iconBg} rounded-lg px-2 py-1`}>
                  <Battery className={`w-5 h-5 ${tier.textColor}`} />
                </div>
              </div>
              <p className={`text-xs ${tier.textColor.replace('-200', '-100')} mb-2`}>
                {tier.capacity}
              </p>
              <div className={`pt-2 border-t ${tier.borderColor}`}>
                <p className={`text-xs ${tier.textColor}`}>{tier.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Volume Discount Info */}
        <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-xs text-emerald-200 mb-2 font-semibold">💰 Volume Discounts Available:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {VOLUME_DISCOUNTS.map((discount) => (
              <div key={discount.threshold} className="text-emerald-100">
                {discount.label}: <span className="text-white font-bold">{discount.discount}% off</span>
              </div>
            ))}
            <div className="text-emerald-200 italic">Max discount</div>
          </div>
        </div>

        {/* Technology Note */}
        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-100">
          <Sparkles className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-semibold">Market Intelligence:</span> Pricing reflects Q4 2025 realistic installed costs including all balance of system components, installation labor, and profit margins. Based on LFP chemistry improvements and actual utility RFP pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
