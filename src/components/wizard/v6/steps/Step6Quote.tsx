/**
 * STEP 6: Quote Review
 * ====================
 * The final summary with all the numbers
 * 
 * Updated: December 29, 2025 - FIXED: Made savings highly visible (was hidden)
 */

import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  Sun, 
  Zap, 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  Download,
  Mail,
  Phone,
  Sparkles,
  Shield,
  Info,
  Plus
} from 'lucide-react';
import type { WizardState } from '../types';
import { POWER_LEVELS } from '../types';
import RequestQuoteModal from '@/components/modals/RequestQuoteModal';
import { exportQuoteAsPDF } from '@/utils/quoteExportUtils';
import type { QuoteExportData } from '@/utils/quoteExportUtils';
import sunIcon from '@/assets/images/sun_icon.png';
import { 
  getIncentivesByZip, 
  calculateIncentives,
  type StateIncentive 
} from '@/services/stateIncentivesService';
import { TrueQuoteVerifyBadge } from '../components/TrueQuoteVerifyBadge';
import { useTrueQuote } from '@/hooks/useTrueQuote';

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
}

export function Step6Quote({ state }: Props) {
  const { calculations, selectedPowerLevel } = state;
  const powerLevel = POWER_LEVELS.find(l => l.id === selectedPowerLevel);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPricingSources, setShowPricingSources] = useState(false);
  const [stateIncentives, setStateIncentives] = useState<StateIncentive[]>([]);
  const [incentiveSummary, setIncentiveSummary] = useState<{
    totalStateIncentive: number;
    federalITC: number;
    netInvestment: number;
    statePrograms?: Array<{ program: string; amount: number; type: string }>;
  } | null>(null);
  const [loadingIncentives, setLoadingIncentives] = useState(true);
  
  // TrueQuote™ Verification Data
  const trueQuoteData = useTrueQuote(state);

  // Load state incentives
  // MUST be before any early returns to comply with React hooks rules
  useEffect(() => {
    async function loadIncentives() {
      if (!state.zipCode || !calculations) return;
      
      setLoadingIncentives(true);
      try {
        // Calculate incentives with new API (excludes equity programs by default)
        const result = await calculateIncentives(
          state.zipCode,
          calculations.totalInvestment,
          calculations.bessKWh,
          'commercial',  // sector
          calculations.solarKW > 0,  // includesSolar
          false  // isEquityEligible (exclude equity programs by default)
        );
        
        // Get the raw incentives for display (filtered list)
        const incentives = await getIncentivesByZip(state.zipCode);
        setStateIncentives(incentives);
        
        // Set the summary with the calculated values
        setIncentiveSummary({
          totalStateIncentive: result.stateIncentives,
          federalITC: result.federalITC,
          netInvestment: result.netInvestment,
          statePrograms: result.statePrograms
        });
      } catch (err) {
        console.error('Error loading state incentives:', err);
      } finally {
        setLoadingIncentives(false);
      }
    }
    
    loadIncentives();
  }, [state.zipCode, calculations]);

  // Early return check - MUST be after all hooks
  if (!calculations || !powerLevel) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Please complete the previous steps first.</p>
      </div>
    );
  }

  // Calculate ITC percentage dynamically (fallback to 30% if not provided)
  const itcPercentage = calculations.federalITCRate 
    ? Math.round(calculations.federalITCRate * 100)
    : calculations.federalITC > 0 && calculations.totalInvestment > 0
    ? Math.round((calculations.federalITC / calculations.totalInvestment) * 100)
    : 30;

  // Generate quote ID if not already set (fallback for backwards compatibility)
  const quoteId = calculations.quoteId || `MQ-${Date.now().toString(36).toUpperCase()}`;

  // Calculate key savings numbers
  const tenYearSavings = calculations.annualSavings * 10;
  const netTenYearValue = tenYearSavings - calculations.netInvestment;

  // Debug logging
  console.log('🔍 Step 6 Solar Debug - DISPLAY VALUES:', {
    fromState_solarTier: state.solarTier,
    fromState_selectedOptions: state.selectedOptions,
    fromCalculations_solarKW: calculations.solarKW,
    fromSelectedSolarTier_sizeKw: (calculations as any).selectedSolarTier?.sizeKw,
    fromSelectedSolarTier_name: (calculations as any).selectedSolarTier?.name,
    MISMATCH_CHECK: {
      calculations_solarKW: calculations.solarKW,
      selectedSolarTier_sizeKw: (calculations as any).selectedSolarTier?.sizeKw,
      areTheyEqual: calculations.solarKW === (calculations as any).selectedSolarTier?.sizeKw,
      difference: calculations.solarKW - ((calculations as any).selectedSolarTier?.sizeKw || 0),
    },
    selectedPowerLevel: state.selectedPowerLevel,
    fullCalculations: calculations,
  });

  // Handle Request Quote button
  const handleRequestQuote = () => {
    setShowRequestModal(true);
  };

  // Handle Download PDF button
  const handleDownloadPDF = async () => {
    try {
      const quoteData: QuoteExportData = {
        projectName: `${state.industryName} - ${powerLevel.name} System`,
        location: `${state.city || ''} ${state.state || ''}`.trim() || state.zipCode || 'Location TBD',
        applicationType: 'Commercial',
        useCase: state.industryName,
        quoteNumber: quoteId,
        quoteDate: new Date().toLocaleDateString(),
        storageSizeMW: calculations.bessKW / 1000,
        storageSizeMWh: calculations.bessKWh / 1000,
        durationHours: powerLevel.durationHours,
        chemistry: 'LiFePO4',
        roundTripEfficiency: 85,
        installationType: 'Ground Mount',
        gridConnection: 'Grid-Tied',
        systemVoltage: 480,
        dcVoltage: 800,
        inverterType: 'PCS',
        numberOfInverters: Math.ceil(calculations.bessKW / 500),
        inverterRating: calculations.bessKW,
        inverterEfficiency: 96,
        switchgearType: 'AC Switchgear',
        switchgearRating: calculations.bessKW * 1.25,
        bmsType: 'Distributed',
        transformerRequired: true,
        transformerRating: calculations.bessKW,
        transformerVoltage: '480V/13.8kV',
        cyclesPerYear: 365,
        warrantyYears: 15,
        utilityRate: calculations.utilityRate || 0.12, // SSOT: Fallback to EIA 2024 national average commercial rate
        demandCharge: calculations.demandCharge || 15,
        solarPVIncluded: calculations.solarKW > 0,
        solarCapacityKW: calculations.solarKW,
        solarPanelType: 'Monocrystalline',
        solarPanelEfficiency: 21,
        systemCost: calculations.totalInvestment,
        showAiNote: false,
      };
      await exportQuoteAsPDF(quoteData);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Unable to generate PDF. Please try again.');
    }
  };

  // Handle Talk to Expert button
  const handleTalkToExpert = () => {
    const subject = encodeURIComponent(`Quote Inquiry - ${state.industryName} - ${quoteId}`);
    const body = encodeURIComponent(`I'm interested in learning more about this energy storage quote:\n\nQuote ID: ${quoteId}\nIndustry: ${state.industryName}\nLocation: ${state.city || state.state || state.zipCode}\nSystem Size: ${(calculations.bessKW / 1000).toFixed(2)} MW / ${(calculations.bessKWh / 1000).toFixed(2)} MWh`);
    window.open(`mailto:sales@merlinenergy.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            Your Quote is Ready
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Merlin Energy Quote
          </h1>
          <p className="text-purple-300 mb-4">
            {powerLevel.name} system for your {state.industryName}
          </p>
          {/* Quote ID with TrueQuote™ Badge */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-slate-400">Quote ID: {quoteId}</span>
            <TrueQuoteVerifyBadge
              quoteId={quoteId}
              worksheetData={trueQuoteData}
              variant="compact"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            HERO SAVINGS BANNER - THE MOST IMPORTANT NUMBER!
            Dark background with CYAN electric number
            ═══════════════════════════════════════════════════════════════════════ */}
        <div 
          className="max-w-3xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)',
            boxShadow: '0 20px 60px rgba(34, 211, 238, 0.15), 0 0 100px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
          }}
        >
          <div className="p-8 text-center">
            <div className="text-slate-400 text-lg font-medium mb-3">
              💰 Your 10-Year Savings with Merlin
            </div>
            <div 
              style={{ 
                fontSize: '4.5rem', 
                lineHeight: 1,
                fontWeight: 900,
                color: '#22d3ee',
                textShadow: '0 0 40px rgba(34, 211, 238, 0.5), 0 0 80px rgba(34, 211, 238, 0.3)',
                letterSpacing: '-0.02em'
              }}
            >
              ${tenYearSavings.toLocaleString()}
            </div>
            <div className="mt-6 flex items-center justify-center gap-8 text-slate-300">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">${Math.round(calculations.annualSavings / 1000)}K</div>
                <div className="text-sm text-slate-500">per year</div>
              </div>
              <div className="w-px h-10 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{calculations.paybackYears.toFixed(1)} yrs</div>
                <div className="text-sm text-slate-500">payback</div>
              </div>
              <div className="w-px h-10 bg-slate-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{calculations.tenYearROI}%</div>
                <div className="text-sm text-slate-500">10yr ROI</div>
              </div>
            </div>
          </div>
          {/* Net Value Footer */}
          <div className="px-8 py-4 bg-black/30 border-t border-cyan-500/20 flex items-center justify-between">
            <span className="text-slate-400">After investment, your net profit:</span>
            <span 
              className="text-2xl font-bold"
              style={{ color: '#10b981' }}
            >
              +${netTenYearValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* State Incentives Section */}
        {!loadingIncentives && incentiveSummary && incentiveSummary.totalStateIncentive > 0 && (
          <div className="max-w-3xl mx-auto p-6 bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">State & Federal Incentives</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="text-slate-400 text-xs mb-1">Federal ITC</div>
                <div className="text-2xl font-bold text-white">${incentiveSummary.federalITC.toLocaleString()}</div>
                <div className="text-emerald-400 text-xs mt-1">30% tax credit</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="text-slate-400 text-xs mb-1">State Incentives</div>
                <div className="text-2xl font-bold text-emerald-400">${incentiveSummary.totalStateIncentive.toLocaleString()}</div>
                <div className="text-slate-500 text-xs mt-1">
                  {incentiveSummary.statePrograms?.length || stateIncentives.length} program{(incentiveSummary.statePrograms?.length || stateIncentives.length) !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="text-slate-400 text-xs mb-1">Net Investment</div>
                <div className="text-2xl font-bold text-cyan-400">${incentiveSummary.netInvestment.toLocaleString()}</div>
                <div className="text-slate-500 text-xs mt-1">After incentives</div>
              </div>
            </div>
            {stateIncentives.length > 0 && (
              <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-300">
                  <strong className="text-emerald-400">Available Programs:</strong> {stateIncentives.slice(0, 3).map(i => i.program_name).join(', ')}
                  {stateIncentives.length > 3 && ` +${stateIncentives.length - 3} more`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TrueQuote™ Badge */}
        {calculations.pricingSources && calculations.pricingSources.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowPricingSources(!showPricingSources)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
            >
              <Shield className="w-4 h-4" />
              TrueQuote™ Verified Pricing
              <Info className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pricing Sources Disclosure */}
        {showPricingSources && calculations.pricingSources && (
          <div className="max-w-2xl mx-auto p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Pricing Data Sources
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              {calculations.pricingSources.map((source, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  {source}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Pricing verified against NREL ATB 2024, EIA utility rates, and vendor databases.
            </p>
          </div>
        )}

        {/* Quote Card */}
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 overflow-hidden">
          {/* Project Summary Header */}
          <div className="p-6 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{powerLevel.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" />
                    {state.city || state.state || state.zipCode}
                    <span className="mx-1">•</span>
                    <Building2 className="w-4 h-4" />
                    {state.industryName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Quote ID</div>
                <div className="text-white font-mono">{quoteId}</div>
              </div>
            </div>
          </div>

          {/* System Components */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
              System Components
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BESS */}
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Battery className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Battery Storage (BESS)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Power Rating</div>
                    <div className="text-white font-semibold">
                      {calculations.bessKW >= 1000 
                        ? `${(calculations.bessKW / 1000).toFixed(1)} MW` 
                        : `${calculations.bessKW} kW`}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Energy Capacity</div>
                    <div className="text-white font-semibold">
                      {calculations.bessKWh >= 1000 
                        ? `${(calculations.bessKWh / 1000).toFixed(1)} MWh` 
                        : `${calculations.bessKWh} kWh`}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Duration</div>
                    <div className="text-white font-semibold">{powerLevel.durationHours} hours</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Chemistry</div>
                    <div className="text-white font-semibold">LiFePO4</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Efficiency</div>
                    <div className="text-white font-semibold">85% RT</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Warranty</div>
                    <div className="text-white font-semibold">15 years</div>
                  </div>
                </div>
              </div>

              {/* Solar (if selected) */}
              {calculations.solarKW > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={sunIcon} alt="Sun" className="w-5 h-5" />
                    <span className="text-white font-medium">Solar Array</span>
                    {(calculations as any).selectedSolarTier?.name && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                        {(calculations as any).selectedSolarTier.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Capacity</div>
                      <div className="text-white font-semibold">{calculations.solarKW} kW</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Panels</div>
                      <div className="text-white font-semibold">
                        {Math.ceil(calculations.solarKW * 1000 / 500)} panels
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Panel Type</div>
                      <div className="text-white font-semibold">Monocrystalline</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Efficiency</div>
                      <div className="text-white font-semibold">21%</div>
                    </div>
                    {state.solarData && (
                      <>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Sun Hours/Day</div>
                          <div className="text-white font-semibold">{state.solarData.sunHours}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Solar Rating</div>
                          <div className="text-white font-semibold">{state.solarData.rating}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* EV Chargers (if selected) */}
              {calculations.evChargers > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium">EV Charging</span>
                    {(calculations as any).selectedEvTier?.name && (
                      <span className="text-xs text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded">
                        {(calculations as any).selectedEvTier.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(calculations as any).selectedEvTier ? (
                      <>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Level 2 (L2)</div>
                          <div className="text-white font-semibold">
                            {(calculations as any).selectedEvTier.l2Count} chargers
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">DC Fast (DCFC)</div>
                          <div className="text-white font-semibold">
                            {(calculations as any).selectedEvTier.dcfcCount} chargers
                          </div>
                        </div>
                        {(calculations as any).selectedEvTier.ultraFastCount > 0 && (
                          <div>
                            <div className="text-slate-500 text-xs mb-1">Ultra-Fast</div>
                            <div className="text-white font-semibold">
                              {(calculations as any).selectedEvTier.ultraFastCount} chargers
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Total Power</div>
                          <div className="text-white font-semibold">
                            {(calculations as any).selectedEvTier.powerRaw} kW
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Ultra-Fast</div>
                          <div className="text-white font-semibold">
                            {((calculations as any).selectedEvTier.ultraFastCount || 0)} chargers
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Total Stations</div>
                          <div className="text-white font-semibold">
                            {(calculations as any).selectedEvTier.l2Count + (calculations as any).selectedEvTier.dcfcCount + ((calculations as any).selectedEvTier.ultraFastCount || 0)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">Stations</div>
                          <div className="text-white font-semibold">{calculations.evChargers} Level 3</div>
                        </div>
                        {(calculations as any).evPowerKW > 0 && (
                          <div>
                            <div className="text-slate-500 text-xs mb-1">Total Power</div>
                            <div className="text-white font-semibold">{(calculations as any).evPowerKW} kW</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Generator (if selected) */}
              {calculations.generatorKW > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Fuel className="w-5 h-5 text-orange-400" />
                    <span className="text-white font-medium">Backup Generator</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Capacity</div>
                      <div className="text-white font-semibold">{calculations.generatorKW} kW</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Fuel Type</div>
                      <div className="text-white font-semibold">Natural Gas</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Runtime</div>
                      <div className="text-white font-semibold">
                        {Math.round(500 / (calculations.generatorKW * 0.07))} hrs
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Coverage</div>
                      <div className="text-white font-semibold">
                        {calculations.generatorKW >= 400 ? 'Full facility' : 
                         calculations.generatorKW >= 200 ? 'Critical loads' : 'Emergency only'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder cards for unselected options */}
              {calculations.solarKW === 0 && (
                <div className="p-4 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-500 font-medium">Solar Array</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Plus className="w-4 h-4" />
                    <span>Not selected</span>
                  </div>
                </div>
              )}

              {calculations.evChargers === 0 && (
                <div className="p-4 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-500 font-medium">EV Charging</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Plus className="w-4 h-4" />
                    <span>Not selected</span>
                  </div>
                </div>
              )}

              {calculations.generatorKW === 0 && (
                <div className="p-4 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <Fuel className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-500 font-medium">Backup Generator</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Plus className="w-4 h-4" />
                    <span>Not selected</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
              Investment Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 px-4 bg-slate-800/30 rounded-lg">
                <span className="text-slate-300">Total System Investment</span>
                <span className="text-white font-semibold text-lg">
                  ${calculations.totalInvestment.toLocaleString()}
                </span>
              </div>
              
              {calculations.federalITC > 0 && (
                <div className="flex justify-between items-center py-2 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-emerald-400 font-medium">Federal ITC Credit ({itcPercentage}%)</span>
                  <span className="text-emerald-400 font-bold text-lg">
                    -${calculations.federalITC.toLocaleString()}
                  </span>
                </div>
              )}
              
              {incentiveSummary && incentiveSummary.totalStateIncentive > 0 && (
                <div className="flex justify-between items-center py-2 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-emerald-400 font-medium">
                    State Incentives
                    {incentiveSummary.statePrograms && incentiveSummary.statePrograms.length > 0 && (
                      <span className="text-xs text-emerald-300 ml-2">
                        ({incentiveSummary.statePrograms.map(p => p.program).join(', ')})
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-400 font-bold text-lg">
                    -${incentiveSummary.totalStateIncentive.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3 px-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <span className="text-white font-bold">Your Net Investment</span>
                <span className="text-2xl font-black text-white">
                  ${calculations.netInvestment.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">
                ${Math.round(calculations.annualSavings / 1000)}K
              </div>
              <div className="text-xs text-slate-400 mt-1">Annual Savings</div>
            </div>
            
            <div className="text-center p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-400">
                {calculations.paybackYears.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Year Payback</div>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {calculations.tenYearROI}%
              </div>
              <div className="text-xs text-slate-400 mt-1">10-Year ROI</div>
            </div>
          </div>
        </div>

        {/* Utility Rate Info */}
        {calculations.utilityName && (
          <div className="max-w-3xl mx-auto p-3 bg-slate-800/30 rounded-lg text-center text-sm text-slate-400">
            Calculations based on <span className="text-white">{calculations.utilityName}</span> rates: 
            {' '}${calculations.utilityRate?.toFixed(2) || 'N/A'}/kWh, 
            {' '}${calculations.demandCharge || 'N/A'}/kW demand charge
            {calculations.hasTOU && (
              <span className="text-purple-400"> • TOU pricing available</span>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleRequestQuote}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/25"
          >
            <Mail className="w-5 h-5" />
            Request Official Quote
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          
          <button 
            onClick={handleTalkToExpert}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
          >
            <Phone className="w-5 h-5" />
            Talk to Expert
          </button>
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto text-center text-xs text-slate-500">
          This is an estimate based on the information provided. Final pricing may vary based on 
          site assessment, utility rates, and equipment availability. Contact us for an official quote.
        </div>
      </div>

      {/* Request Quote Modal */}
      <RequestQuoteModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        quoteData={{
          storageSizeMW: calculations.bessKW / 1000,
          durationHours: powerLevel.durationHours,
          energyCapacity: calculations.bessKWh / 1000,
          solarMW: calculations.solarKW > 0 ? calculations.solarKW / 1000 : 0,
          totalCost: calculations.totalInvestment,
          industryName: state.industryName,
          location: `${state.city || ''} ${state.state || ''}`.trim() || state.zipCode,
        }}
      />
    </>
  );
}
