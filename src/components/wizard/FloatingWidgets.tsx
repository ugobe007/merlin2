/**
 * FLOATING WIDGETS COMPONENT
 * ==========================
 * 
 * Replaces the sidebar with floating action buttons that open overlay panels.
 * This keeps the main content area full-width and unobstructed.
 * 
 * Widgets:
 * - Savings Scout™ - Opportunity analysis
 * - Config Summary - Current configuration
 * - Help - Wizard guidance
 * 
 * @created December 17, 2025
 * @author Merlin Team
 */

import React, { useState } from 'react';
import { Telescope, BarChart3, HelpCircle, Battery, Sun, Zap, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { FloatingWidget, FloatingPanel } from './ui';
import { SavingsScoutNavbar } from './indicators/SavingsScoutWidget';

// ============================================================================
// TYPES
// ============================================================================

interface FloatingWidgetsProps {
  /** Peak demand in kW */
  peakDemandKW: number;
  /** Selected US state */
  state: string;
  /** Industry profile slug */
  industryProfile: string;
  /** Industry display name */
  industryName?: string;
  /** Current configuration */
  currentConfig?: {
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    generatorKW: number;
    annualSavings: number;
    paybackYears?: number;
  };
  /** Callback to navigate to a specific section */
  onNavigateToSection?: (section: number) => void;
  /** Recommended values from Merlin */
  merlinRecommendation?: {
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
  };
  /** Facility details for Savings Scout */
  facilityDetails?: {
    rooms?: number;
    hasEVChargers?: boolean;
    evChargerCount?: number;
    evChargersL2?: number;
    evChargersDCFC?: number;
    gridConnection?: 'on-grid' | 'off-grid' | 'limited';
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FloatingWidgets({
  peakDemandKW,
  state,
  industryProfile,
  industryName,
  currentConfig,
  onNavigateToSection,
  merlinRecommendation,
  facilityDetails,
}: FloatingWidgetsProps) {
  const [savingsScoutOpen, setSavingsScoutOpen] = useState(false);
  const [configSummaryOpen, setConfigSummaryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Format helpers
  const formatKW = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  // Calculate coverage
  const totalConfiguredKW = currentConfig 
    ? currentConfig.batteryKW + currentConfig.solarKW + currentConfig.generatorKW
    : 0;
  const coverage = peakDemandKW > 0 
    ? Math.min(200, Math.round((totalConfiguredKW / peakDemandKW) * 100))
    : 0;
  const hasConfig = totalConfiguredKW > 0;
  
  // Badge count for Savings Scout (mock - could come from actual opportunity count)
  const opportunityCount = state ? 3 : 0;
  
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING ACTION BUTTONS (Fixed right edge)
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Savings Scout Widget */}
      <FloatingWidget
        icon={<Telescope className="w-5 h-5" />}
        label="Savings Scout"
        badge={opportunityCount > 0 ? opportunityCount : undefined}
        onClick={() => setSavingsScoutOpen(true)}
        position={2}
        variant="default"
      />
      
      {/* Config Summary Widget */}
      <FloatingWidget
        icon={<BarChart3 className="w-5 h-5" />}
        label="Your Config"
        onClick={() => setConfigSummaryOpen(true)}
        position={1}
        variant={hasConfig ? 'success' : 'default'}
      />
      
      {/* Help Widget */}
      <FloatingWidget
        icon={<HelpCircle className="w-5 h-5" />}
        label="Help"
        onClick={() => setHelpOpen(true)}
        position={0}
        variant="default"
      />
      
      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-OUT PANELS
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Savings Scout Panel */}
      <FloatingPanel
        isOpen={savingsScoutOpen}
        onClose={() => setSavingsScoutOpen(false)}
        title="Savings Scout™"
      >
        <div className="space-y-6">
          {state ? (
            <>
              <p className="text-gray-600">
                Based on your location in <strong className="text-purple-700">{state}</strong> and 
                facility type <strong className="text-purple-700">{industryName || industryProfile}</strong>:
              </p>
              
              {/* Inline Savings Scout */}
              <div className="border border-purple-200 rounded-xl overflow-hidden">
                <SavingsScoutNavbar
                  state={state}
                  industryProfile={industryProfile}
                  peakDemandKW={peakDemandKW || 200}
                  facilityDetails={facilityDetails || {}}
                  onGetQuote={() => {
                    setSavingsScoutOpen(false);
                    onNavigateToSection?.(5);
                  }}
                  onFullAnalysis={() => {
                    setSavingsScoutOpen(false);
                    onNavigateToSection?.(3);
                  }}
                />
              </div>
              
              {/* Quick opportunities list */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Available Opportunities</h4>
                
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-emerald-900">Demand Charge Savings</h5>
                      <p className="text-sm text-emerald-700">Reduce peak demand charges with battery storage</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Sun className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-amber-900">Solar Integration</h5>
                      <p className="text-sm text-amber-700">Pair solar with storage for maximum savings</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-900">30% ITC Tax Credit</h5>
                      <p className="text-sm text-blue-700">Federal investment tax credit available</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Telescope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Select a location to see savings opportunities in your area.
              </p>
            </div>
          )}
        </div>
      </FloatingPanel>
      
      {/* Config Summary Panel */}
      <FloatingPanel
        isOpen={configSummaryOpen}
        onClose={() => setConfigSummaryOpen(false)}
        title="Your Configuration"
      >
        <div className="space-y-6">
          {currentConfig && hasConfig ? (
            <>
              {/* Power Coverage */}
              <div className={`p-4 rounded-xl border-2 ${
                coverage >= 100 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : coverage >= 50 
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">Power Coverage</span>
                  <span className={`text-2xl font-bold ${
                    coverage >= 100 ? 'text-emerald-600' : coverage >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {coverage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      coverage >= 100 
                        ? 'bg-gradient-to-r from-emerald-400 to-green-400' 
                        : coverage >= 50 
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                          : 'bg-gradient-to-r from-red-400 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, coverage)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatKW(totalConfiguredKW)} configured / {formatKW(peakDemandKW)} needed
                </p>
              </div>
              
              {/* Equipment Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Equipment</h4>
                
                {currentConfig.batteryKW > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Battery className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-700">Battery Storage</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-purple-700">{formatKW(currentConfig.batteryKW)}</div>
                      <div className="text-xs text-gray-500">{formatKWh(currentConfig.batteryKWh)}</div>
                    </div>
                  </div>
                )}
                
                {currentConfig.solarKW > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-600" />
                      <span className="text-gray-700">Solar Array</span>
                    </div>
                    <div className="font-semibold text-amber-700">{formatKW(currentConfig.solarKW)}</div>
                  </div>
                )}
                
                {currentConfig.generatorKW > 0 && (
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-slate-600" />
                      <span className="text-gray-700">Generator</span>
                    </div>
                    <div className="font-semibold text-slate-700">{formatKW(currentConfig.generatorKW)}</div>
                  </div>
                )}
              </div>
              
              {/* Financial Summary */}
              {currentConfig.annualSavings > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="font-semibold text-emerald-900 mb-3">Estimated Savings</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span className="text-gray-700">Annual Savings</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatCurrency(currentConfig.annualSavings)}/yr
                    </span>
                  </div>
                  {currentConfig.paybackYears && currentConfig.paybackYears > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span className="text-gray-700">Payback Period</span>
                      </div>
                      <span className="font-semibold text-emerald-700">
                        {currentConfig.paybackYears.toFixed(1)} years
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Merlin's Recommendation */}
              {merlinRecommendation && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-2">Merlin Recommends</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>Battery: {formatKW(merlinRecommendation.batteryKW)} / {formatKWh(merlinRecommendation.batteryKWh)}</p>
                    {merlinRecommendation.solarKW > 0 && (
                      <p>Solar: {formatKW(merlinRecommendation.solarKW)}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <button
                onClick={() => {
                  setConfigSummaryOpen(false);
                  onNavigateToSection?.(5);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                See My Quote
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                Complete the wizard to see your configuration summary.
              </p>
              <button
                onClick={() => {
                  setConfigSummaryOpen(false);
                  onNavigateToSection?.(3);
                }}
                className="px-6 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
              >
                Continue Wizard
              </button>
            </div>
          )}
        </div>
      </FloatingPanel>
      
      {/* Help Panel */}
      <FloatingPanel
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Need Help?"
      >
        <div className="space-y-6">
          {/* How This Wizard Works */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 mb-3">How This Wizard Works</h4>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Location & Industry</strong> - Tell us where you are and what type of facility</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Facility Details</strong> - Share specifics about your operation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Goals & Add-ons</strong> - Choose solar, EV chargers, and other options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span><strong>Compare Options</strong> - See your config vs Merlin's recommendation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span><strong>Get Your Quote</strong> - Download your TrueQuote™ with full transparency</span>
              </li>
            </ol>
          </div>
          
          {/* FAQ */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Frequently Asked Questions</h4>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium text-gray-700">What is TrueQuote™?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="p-3 text-sm text-gray-600">
                TrueQuote™ is our transparent quoting system where every number is traceable to an authoritative source like NREL, DOE, or EIA. No black boxes.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium text-gray-700">How is my system sized?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="p-3 text-sm text-gray-600">
                We use industry-standard formulas from IEEE and NREL based on your facility type, peak demand, and energy goals. All calculations are shown.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <span className="font-medium text-gray-700">Can I customize my quote?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="p-3 text-sm text-gray-600">
                Yes! You can accept Merlin's AI recommendation or customize every aspect of your system configuration.
              </div>
            </details>
          </div>
          
          {/* Contact */}
          <div className="p-4 bg-slate-100 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
            <p className="text-sm text-gray-600 mb-1">
              Email: <a href="mailto:support@noahenergy.com" className="text-purple-600 hover:underline">support@noahenergy.com</a>
            </p>
            <p className="text-sm text-gray-600">
              Phone: <a href="tel:+18001234567" className="text-purple-600 hover:underline">1-800-123-4567</a>
            </p>
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}

export default FloatingWidgets;
