// ═══════════════════════════════════════════════════════════════════════════
// QUOTE RESULTS SECTION (Section 5)
// Extracted from StreamlinedWizard.tsx - Dec 2025 Refactor
// Updated Dec 15, 2025: Added Solar Sizing Modal (Universal Pattern)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  ArrowLeft,
  Battery,
  CheckCircle,
  ChevronDown,
  Clock,
  Crown,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Mail,
  Phone,
  Settings,
  Shield,
  Sun,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { FACILITY_PRESETS } from '../constants/wizardConstants';
import type { WizardState, PremiumConfiguration, PremiumComparison, RFQFormState, PhysicalConstraints } from '../types/wizardTypes';
import { TrueQuoteBadge, TrueQuoteBanner } from '@/components/shared/TrueQuoteBadge';
import { QuoteComplianceFooter } from '@/components/shared/IndustryComplianceBadges';
import { QuoteLineItemWithSource } from '@/components/quotes';
import { SolarSizingModal } from '../modals';
import { 
  AUTHORITATIVE_SOURCES, 
  PRICING_BENCHMARKS,
  getBESSSizingRatioWithSource,
  getSolarILRWithSource,
  getCriticalLoadWithSource,
  getGeneratorReserveMarginWithSource,
  type BESSUseCase,
} from '@/services/benchmarkSources';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';
import { createRFQ, type CreateRFQData } from '@/services/vendorService';
import merlinImage from '@/assets/images/new_Merlin.png';

interface QuoteResultsSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  premiumConfig: PremiumConfiguration | null;
  premiumComparison: PremiumComparison | null;
  onBack: () => void;
  onStartNew: () => void;
  /** Navigate to Advanced Quote Builder for pro users */
  onOpenAdvanced?: () => void;
}

export function QuoteResultsSection({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  premiumConfig,
  premiumComparison,
  onBack,
  onStartNew,
  onOpenAdvanced,
}: QuoteResultsSectionProps) {
  const [showPremiumView, setShowPremiumView] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [showSolarSizingModal, setShowSolarSizingModal] = useState(false);
  const [rfqForm, setRfqForm] = useState<RFQFormState>({
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectTimeline: 'immediate',
  });
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [rfqType, setRfqType] = useState<'standard' | 'premium'>('standard');
  
  // Handle solar sizing constraints update
  const handleSolarConstraintsSave = (constraints: PhysicalConstraints) => {
    setWizardState(prev => ({
      ...prev,
      physicalConstraints: constraints,
      // Cap solar to max if it exceeds the constraint
      solarKW: constraints.maxSolarKW && prev.solarKW > constraints.maxSolarKW 
        ? constraints.maxSolarKW 
        : prev.solarKW,
    }));
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfqSubmitting(true);

    const rfqData: CreateRFQData = {
      projectName: rfqForm.projectName,
      systemSizeMW: wizardState.batteryKW / 1000,
      durationHours: wizardState.durationHours,
      solarMW: wizardState.solarKW / 1000,
      windMW: wizardState.windTurbineKW / 1000,
      generatorMW: wizardState.generatorKW / 1000,
      location: wizardState.state,
      useCase: wizardState.selectedIndustry,
      isPremium: rfqType === 'premium',
      customerEmail: rfqForm.customerEmail,
      customerName: rfqForm.customerName,
      customerPhone: rfqForm.customerPhone,
      requirements: rfqType === 'premium' && premiumConfig ? {
        batteryManufacturer: premiumConfig.battery.manufacturer,
        batteryModel: premiumConfig.battery.model,
        inverterManufacturer: premiumConfig.inverter.manufacturer,
        inverterModel: premiumConfig.inverter.model,
        minWarrantyYears: premiumConfig.battery.warrantyYears,
        minCycleLife: premiumConfig.battery.cycleLife,
      } : undefined,
      standardQuoteCost: wizardState.quoteResult?.costs.totalProjectCost || 0,
      premiumQuoteCost: premiumComparison?.premium.totalCost,
      projectTimeline: rfqForm.projectTimeline,
    };

    const result = await createRFQ(rfqData);
    setRfqSubmitting(false);

    if (result.success) {
      setRfqSuccess(result.message || 'Your quote request has been submitted.');
    } else {
      alert(result.error || 'Failed to submit. Please try again.');
    }
  };

  const quoteData = {
    storageSizeMW: wizardState.batteryKW / 1000,
    durationHours: wizardState.durationHours,
    solarMW: wizardState.solarKW / 1000,
    windMW: wizardState.windTurbineKW / 1000,
    generatorMW: wizardState.generatorKW / 1000,
    location: wizardState.state,
    industryTemplate: wizardState.selectedIndustry || 'bess',
    gridConnection: wizardState.gridConnection,
    totalProjectCost: wizardState.quoteResult?.costs.totalProjectCost || 0,
    annualSavings: wizardState.quoteResult?.financials.annualSavings || 0,
    paybackYears: wizardState.quoteResult?.financials.paybackYears || 0,
    taxCredit: wizardState.quoteResult?.costs.taxCredit || 0,
    netCost: wizardState.quoteResult?.costs.netCost || 0,
    installationOption: 'epc' as const,
    shippingOption: 'standard' as const,
    financingOption: 'cash' as const,
    
    // Power Profile & Opportunity Metrics (Dec 11, 2025)
    powerProfile: {
      totalEnergyKWh: wizardState.batteryKWh + (wizardState.solarKW * 5), // Battery + 5hr solar
      totalPowerKW: wizardState.batteryKW + wizardState.solarKW + wizardState.generatorKW,
      batteryKWh: wizardState.batteryKWh,
      batteryKW: wizardState.batteryKW,
      solarKW: wizardState.solarKW,
      generatorKW: wizardState.generatorKW,
    },
    powerGap: (() => {
      const peakDemandKW = wizardState.peakDemandKW || wizardState.batteryKW || 500;
      const configuredKW = wizardState.batteryKW + wizardState.solarKW + wizardState.generatorKW;
      const coveragePercent = peakDemandKW > 0 ? Math.round((configuredKW / peakDemandKW) * 100) : 0;
      const gapKW = Math.max(0, peakDemandKW - configuredKW);
      return {
        peakDemandKW,
        configuredKW,
        coveragePercent,
        gapKW,
        status: (coveragePercent >= 100 ? 'covered' : coveragePercent >= 50 ? 'partial' : 'gap') as 'covered' | 'partial' | 'gap',
      };
    })(),
    solarOpportunity: wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay ? (() => {
      const solarHours = wizardState.geoRecommendations!.profile.avgSolarHoursPerDay;
      const rating = Math.min(5, Math.max(1, Math.round(solarHours - 2)));
      const labels: Record<number, string> = { 1: 'Limited', 2: 'Fair', 3: 'Good', 4: 'Excellent', 5: 'Exceptional' };
      return {
        solarHours,
        rating,
        label: labels[rating] || 'Good',
        estimatedLCOE: solarHours * 0.015, // Rough LCOE estimate
      };
    })() : undefined,
    energyOpportunities: wizardState.geoRecommendations ? (() => {
      const geo = wizardState.geoRecommendations!;
      const peakShavingActive = (geo.profile?.avgDemandCharge || 0) > 10 || wizardState.batteryKW > 100;
      const arbitrageActive = (geo.profile?.avgElectricityRate || 0) > 0.12;
      const gridStabilityActive = (geo.profile?.gridReliabilityScore || 100) < 80;
      const demandResponseActive = (geo.profile?.avgDemandCharge || 0) > 15;
      
      return {
        peakShaving: {
          active: peakShavingActive,
          value: geo.profile?.avgDemandCharge ? `$${geo.profile.avgDemandCharge}/kW` : undefined,
          savings: '20-40% on demand charges',
        },
        arbitrage: {
          active: arbitrageActive,
          value: geo.profile?.avgElectricityRate ? `$${geo.profile.avgElectricityRate.toFixed(3)}/kWh` : undefined,
          savings: '10-25% on energy costs',
        },
        gridStability: {
          active: gridStabilityActive,
          value: geo.profile?.gridReliabilityScore ? `${geo.profile.gridReliabilityScore}% reliable` : undefined,
          savings: 'Avoid $10K-100K+ outage costs',
        },
        demandResponse: {
          active: demandResponseActive,
          value: undefined,
          savings: '$50-200/kW/year in DR payments',
        },
        activeCount: [peakShavingActive, arbitrageActive, gridStabilityActive, demandResponseActive].filter(Boolean).length,
      };
    })() : undefined,
  };

  // Dec 16, 2025: QuoteResultsSection is now Section 6
  const SECTION_NUMBER = 6;

  return (
    <div
      ref={sectionRef}
      className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== SECTION_NUMBER ? 'hidden' : ''}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#060F76] hover:bg-[#0815a9] rounded-lg transition-colors border border-[#4b59f5]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configuration
          </button>
          <div className="px-3 py-1 bg-[#6700b6] text-white text-sm font-medium rounded-full">Step 5 of 5 • Final Quote</div>
        </div>

        {wizardState.quoteResult ? (
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 bg-[#68BFFA]/20 border-2 border-[#68BFFA] rounded-full px-5 py-2">
                  <CheckCircle className="w-5 h-5 text-[#68BFFA]" />
                  <span className="text-white font-semibold">Quote Complete!</span>
                </div>
                <TrueQuoteBadge size="md" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#68BFFA] via-[#6700b6] to-[#ffa600]">Custom Quote</span>
              </h2>
              <p className="text-gray-400">
                {wizardState.industryName} • {wizardState.state} • {wizardState.facilitySize.toLocaleString()} {FACILITY_PRESETS[wizardState.selectedIndustry]?.unit || 'sq ft'}
              </p>
            </div>

            <TrueQuoteBanner variant="compact" />

            {/* Main Savings Card */}
            <div className="bg-gradient-to-br from-[#68BFFA]/20 via-[#6700b6]/20 to-[#ffa600]/20 rounded-3xl p-8 border-4 border-[#68BFFA] text-center mb-8 mt-6 shadow-lg">
              <p className="text-[#ffa600] uppercase tracking-widest text-sm font-bold mb-2">💰 Estimated Annual Savings</p>
              <p className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#68BFFA] via-[#6700b6] to-[#ffa600]">
                ${Math.round(wizardState.quoteResult.financials.annualSavings).toLocaleString()}
              </p>
              <p className="text-gray-400 mt-2">per year</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Clock} color="purple" value={wizardState.quoteResult.financials.paybackYears.toFixed(1)} label="Year Payback" />
              <StatCard icon={TrendingDown} color="malibu" value={`${Math.round(wizardState.quoteResult.financials.roi25Year)}%`} label="25-Year ROI" />
              <StatCard icon={Battery} color="arapawa" value={wizardState.batteryKWh.toLocaleString()} label="kWh Storage" />
              <StatCard icon={DollarSign} color="orange" value={`$${Math.round(wizardState.quoteResult.costs.netCost / 1000)}K`} label="Net Cost" />
            </div>

            {/* EV Charger Analysis */}
            {(wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
              <EVChargerAnalysis wizardState={wizardState} />
            )}

            {/* Cost Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <InvestmentSummary
                wizardState={wizardState}
                premiumConfig={premiumConfig}
                premiumComparison={premiumComparison}
                showPremiumView={showPremiumView}
                setShowPremiumView={setShowPremiumView}
                onRequestPremium={() => {
                  setRfqType('premium');
                  setRfqForm(prev => ({ ...prev, projectName: `${wizardState.industryName} - Premium BESS` }));
                  setShowRFQModal(true);
                }}
              />
              <SystemSpecs 
                wizardState={wizardState} 
                onRefineSolar={() => setShowSolarSizingModal(true)}
              />
            </div>

            {/* CTA Buttons */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ExportDropdown quoteData={quoteData} equipment={wizardState.quoteResult.equipment} />
              <button
                onClick={() => {
                  setRfqType('standard');
                  setRfqForm(prev => ({ ...prev, projectName: `${wizardState.industryName} - BESS Project` }));
                  setShowRFQModal(true);
                }}
                className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#68BFFA] to-[#48b1f8] hover:from-[#48b1f8] hover:to-[#28a1e8] text-white rounded-xl font-bold transition-colors border-2 border-[#8dcefb]"
              >
                <Mail className="w-5 h-5" />
                Get Vendor Quotes
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Merlin Energy Quote Request');
                  const body = encodeURIComponent(`Hi,\n\nI completed a quote on Merlin Energy.\n\nQuote Details:\n- Industry: ${wizardState.industryName}\n- Location: ${wizardState.state}\n- Battery: ${wizardState.batteryKWh} kWh\n- Annual Savings: $${Math.round(wizardState.quoteResult!.financials.annualSavings).toLocaleString()}\n\nPlease contact me to schedule a consultation.\n\nThank you!`);
                  window.open(`mailto:sales@merlinenergy.com?subject=${subject}&body=${body}`);
                }}
                className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#6700b6] to-[#060F76] hover:from-[#7900d6] hover:to-[#0815a9] text-white rounded-xl font-bold transition-colors border-2 border-[#ad42ff]"
              >
                <Phone className="w-5 h-5" />
                Consultation
              </button>
              <button
                onClick={onStartNew}
                className="flex items-center justify-center gap-2 py-4 bg-[#ffa600]/20 hover:bg-[#ffa600]/40 text-[#ffd689] rounded-xl font-bold transition-colors border-2 border-[#ffa600]"
              >
                <ArrowLeft className="w-5 h-5" />
                Start New Quote
              </button>
            </div>

            <QuoteComplianceFooter methodologyVersion="1.0.0" className="mb-6" />

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-purple-200">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                <div className="text-left">
                  <p className="text-gray-800 font-bold">Powered by Merlin Energy</p>
                  <p className="text-xs text-gray-500">AI-Optimized Battery Storage Solutions</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-800 font-bold text-xl">Generating your quote...</p>
            <p className="text-gray-500 mt-2">This takes just a moment</p>
          </div>
        )}
      </div>

      {/* RFQ Modal */}
      {showRFQModal && (
        <RFQModal
          rfqForm={rfqForm}
          setRfqForm={setRfqForm}
          rfqType={rfqType}
          rfqSubmitting={rfqSubmitting}
          rfqSuccess={rfqSuccess}
          wizardState={wizardState}
          premiumConfig={premiumConfig}
          premiumComparison={premiumComparison}
          onSubmit={handleSubmitRFQ}
          onClose={() => { setShowRFQModal(false); setRfqSuccess(null); }}
        />
      )}
      
      {/* Solar Sizing Modal (Dec 2025 - Universal Pattern) */}
      <SolarSizingModal
        show={showSolarSizingModal}
        onClose={() => setShowSolarSizingModal(false)}
        onSave={handleSolarConstraintsSave}
        currentConstraints={wizardState.physicalConstraints}
        facilityType={wizardState.selectedIndustry}
        facilityName={wizardState.industryName}
        currentSolarKW={wizardState.solarKW}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, color, value, label }: { icon: any; color: string; value: string; label: string }) {
  const colorMap: Record<string, string> = {
    purple: 'border-[#6700b6] text-[#ad42ff] bg-[#6700b6]/10',
    malibu: 'border-[#68BFFA] text-[#68BFFA] bg-[#68BFFA]/10',
    arapawa: 'border-[#060F76] text-[#4b59f5] bg-[#060F76]/20',
    orange: 'border-[#ffa600] text-[#ffa600] bg-[#ffa600]/10',
    amber: 'border-amber-200 text-amber-500',
  };
  return (
    <div className={`bg-slate-800/50 rounded-2xl p-5 text-center border-2 ${colorMap[color]} shadow-md`}>
      <Icon className={`w-8 h-8 ${colorMap[color].split(' ')[1]} mx-auto mb-2`} />
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function EVChargerAnalysis({ wizardState }: { wizardState: WizardState }) {
  const chargerPeakKW = (wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 150) + (wizardState.evChargersHPC * 350);
  const batteryHours = chargerPeakKW > 0 ? wizardState.batteryKWh / chargerPeakKW : 0;
  const coveragePercent = wizardState.batteryKW > 0 ? Math.min(100, (wizardState.batteryKW / chargerPeakKW) * 100) : 0;
  const dailyChargerKWh = chargerPeakKW * 8 * 0.3;
  const dailySolarKWh = wizardState.solarKW * 5;
  const offsetPercent = dailyChargerKWh > 0 ? Math.min(100, (dailySolarKWh / dailyChargerKWh) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 mb-8">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        EV Charger Energy Analysis
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Peak Charger Demand</p>
          <p className="text-2xl font-bold text-gray-800">{chargerPeakKW.toLocaleString()} kW</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Battery Coverage</p>
          <p className={`text-2xl font-bold ${coveragePercent >= 80 ? 'text-emerald-600' : coveragePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {coveragePercent.toFixed(0)}% Peak
          </p>
          <p className="text-xs text-gray-500 mt-1">{batteryHours >= 1 ? `${batteryHours.toFixed(1)} hrs at full demand` : 'Consider larger battery'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Solar Offset</p>
          <p className={`text-2xl font-bold ${wizardState.solarKW > 0 ? (offsetPercent >= 50 ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-400'}`}>
            {wizardState.solarKW > 0 ? `${offsetPercent.toFixed(0)}%` : 'No Solar'}
          </p>
        </div>
      </div>
    </div>
  );
}

function InvestmentSummary({
  wizardState, premiumConfig, premiumComparison, showPremiumView, setShowPremiumView, onRequestPremium
}: {
  wizardState: WizardState; premiumConfig: PremiumConfiguration | null; premiumComparison: PremiumComparison | null;
  showPremiumView: boolean; setShowPremiumView: (v: boolean) => void; onRequestPremium: () => void;
}) {
  const [showAudit, setShowAudit] = useState(false);
  
  // Get benchmark sources for TrueQuote attribution
  const bessSource = AUTHORITATIVE_SOURCES['nrel-atb-2024'];
  const solarSource = AUTHORITATIVE_SOURCES['nrel-cost-benchmark-2024'];
  const installationSource = AUTHORITATIVE_SOURCES['nrel-cost-benchmark-2024']; // Installation costs also from NREL
  const itcSource = AUTHORITATIVE_SOURCES['ira-2022'];
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-md">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
        <DollarSign className="w-6 h-6 text-emerald-500" />
        Investment Summary
        <span className="ml-auto text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-semibold">
          TrueQuote™ Verified
        </span>
      </h3>
      <div className="space-y-4 text-base">
        {/* Equipment Cost with Source Attribution */}
        <QuoteLineItemWithSource
          label="Equipment Cost"
          value={Math.round(wizardState.quoteResult!.costs.equipmentCost)}
          unit="$"
          source={bessSource}
          description="Battery, inverter, BOS per NREL ATB 2024"
        />
        
        {/* Installation Cost */}
        <QuoteLineItemWithSource
          label="Installation"
          value={Math.round(wizardState.quoteResult!.costs.installationCost)}
          unit="$"
          source={bessSource}
          description="25% of equipment, industry standard"
        />
        
        {/* Total Project Cost */}
        <QuoteLineItemWithSource
          label="Total Project Cost"
          value={Math.round(wizardState.quoteResult!.costs.totalProjectCost)}
          unit="$"
          isTotal
          className="py-2 border-t border-gray-200"
        />
        
        {/* Federal Tax Credit with IRA Source */}
        <QuoteLineItemWithSource
          label="Federal Tax Credit (30%)"
          value={Math.round(wizardState.quoteResult!.costs.taxCredit)}
          unit="$"
          isCredit
          source={itcSource}
          description="IRA standalone storage ITC (2022)"
        />
        
        {/* Net Cost */}
        <div className="flex justify-between py-4 bg-emerald-100 rounded-lg px-4 text-xl">
          <span className="text-emerald-700 font-bold">Net Cost</span>
          <span className="text-emerald-600 font-black text-2xl">${Math.round(wizardState.quoteResult!.costs.netCost).toLocaleString()}</span>
        </div>
      </div>
      
      {/* TrueQuote Source Summary */}
      <button
        onClick={() => setShowAudit(!showAudit)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
      >
        <Info className="w-4 h-4" />
        {showAudit ? 'Hide' : 'View'} TrueQuote™ Sources
        <ChevronDown className={`w-4 h-4 transition-transform ${showAudit ? 'rotate-180' : ''}`} />
      </button>
      
      {showAudit && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
          <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            TrueQuote™ Benchmark Sources
          </div>
          
          {/* Pricing Sources */}
          <div className="mb-3">
            <p className="font-medium text-gray-700 mb-1">Equipment Pricing:</p>
            <ul className="space-y-1 text-gray-600 ml-2">
              <li>• BESS: {bessSource.name} ({bessSource.vintage})</li>
              <li>• Solar: {solarSource.name} ({solarSource.vintage})</li>
              <li>• Installation: {installationSource.name} ({installationSource.vintage})</li>
              <li>• Tax Credit: {itcSource.name} ({itcSource.vintage})</li>
            </ul>
          </div>
          
          {/* Sizing Methodology Sources */}
          <div className="mb-3 pt-2 border-t border-gray-200">
            <p className="font-medium text-gray-700 mb-1">Sizing Methodology v2.0:</p>
            <ul className="space-y-1 text-gray-600 ml-2">
              <li>• BESS/Peak Ratio: IEEE 4538388, MDPI Energies 11(8):2048</li>
              <li>• Solar ILR: NREL ATB 2024 PV-Plus-Battery, EIA Today in Energy</li>
              <li>• Critical Load: IEEE 446-1995 (Orange Book), NEC 700/701/702</li>
              <li>• Generator Sizing: LADWP Backup Power Guide, WPP Generator Sizing</li>
            </ul>
          </div>
          
          {/* Applied Ratios */}
          <div className="pt-2 border-t border-gray-200">
            <p className="font-medium text-gray-700 mb-1">Applied Sizing Ratios:</p>
            <ul className="space-y-1 text-gray-600 ml-2">
              <li>• BESS Power: {((wizardState.batteryKW / (wizardState.peakDemandKW || 1)) * 100).toFixed(0)}% of peak demand</li>
              {wizardState.wantsSolar && wizardState.solarKW > 0 && (
                <li>• Solar Array: {((wizardState.solarKW / (wizardState.batteryKW || 1)) * 100).toFixed(0)}% of BESS capacity (ILR)</li>
              )}
              {wizardState.wantsGenerator && wizardState.generatorKW > 0 && (
                <li>• Generator: Critical load × 1.25 reserve margin</li>
              )}
            </ul>
          </div>
          
          <p className="mt-3 text-gray-500 italic">
            All sizing and pricing verified against authoritative industry sources.
            Methodology: Merlin BESS Sizing v2.0.0 (Dec 2025).
          </p>
        </div>
      )}

      {/* Premium Option */}
      {premiumComparison && premiumConfig && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button onClick={() => setShowPremiumView(!showPremiumView)} className="w-full text-left group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-amber-700">MERLIN Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-600">${Math.round(premiumComparison.premium.totalCost * 0.7).toLocaleString()}</span>
                <ChevronDown className={`w-5 h-5 text-amber-500 transition-transform ${showPremiumView ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </button>

          {showPremiumView && (
            <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Battery className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">{premiumConfig.battery.manufacturer} {premiumConfig.battery.model}</p>
                    <p className="text-gray-600">{premiumConfig.battery.warrantyYears}-year warranty • {premiumConfig.battery.cycleLife.toLocaleString()} cycles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">{premiumConfig.inverter.manufacturer} {premiumConfig.inverter.model}</p>
                    <p className="text-gray-600">{(premiumConfig.inverter.efficiency * 100).toFixed(1)}% efficiency</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestPremium(); }}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-sm"
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  Get Premium Vendor Quotes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SystemSpecs({ wizardState, onRefineSolar }: { wizardState: WizardState; onRefineSolar?: () => void }) {
  const hasPhysicalConstraints = wizardState.physicalConstraints?.isRefined;
  const maxSolarKW = wizardState.physicalConstraints?.maxSolarKW;
  const isCapped = maxSolarKW && wizardState.solarKW >= maxSolarKW;
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-md">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
        <Info className="w-6 h-6 text-blue-500" />
        System Specifications
      </h3>
      <div className="space-y-4 text-base">
        <div className="flex justify-between"><span className="text-gray-600">Battery Power</span><span className="text-gray-900 font-semibold text-lg">{wizardState.batteryKW.toLocaleString()} kW</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Storage Capacity</span><span className="text-gray-900 font-semibold text-lg">{wizardState.batteryKWh.toLocaleString()} kWh</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Duration</span><span className="text-gray-900 font-semibold text-lg">{wizardState.durationHours} hours</span></div>
        
        {/* Solar with Refine button */}
        {wizardState.solarKW > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Solar Capacity</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 font-semibold text-lg">{wizardState.solarKW.toLocaleString()} kW</span>
              {onRefineSolar && (
                <button
                  onClick={onRefineSolar}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
                >
                  <Sun className="w-3 h-3" />
                  Refine
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Show constraint badge if solar was capped */}
        {hasPhysicalConstraints && isCapped && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Sun className="w-4 h-4" />
            <span>Solar sized to your {wizardState.physicalConstraints.roofSpaceSqFt?.toLocaleString()} sq ft roof</span>
          </div>
        )}
        
        <div className="flex justify-between"><span className="text-gray-600">Location</span><span className="text-gray-900 font-semibold text-lg">{wizardState.state}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Electricity Rate</span><span className="text-gray-900 font-semibold text-lg">${wizardState.electricityRate.toFixed(2)}/kWh</span></div>
      </div>
    </div>
  );
}

function ExportDropdown({ quoteData, equipment }: { quoteData: any; equipment: any }) {
  return (
    <div className="relative group">
      <button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
        <Download className="w-5 h-5" />
        Export Quote
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
        <button onClick={() => generatePDF(quoteData, equipment)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 border-b border-gray-100">
          <FileText className="w-5 h-5 text-red-500" />
          <div><div className="font-semibold">PDF Document</div><div className="text-xs text-gray-500">Professional quote</div></div>
        </button>
        <button onClick={() => generateWord(quoteData, equipment)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100">
          <FileText className="w-5 h-5 text-blue-500" />
          <div><div className="font-semibold">Word Document</div><div className="text-xs text-gray-500">Editable proposal</div></div>
        </button>
        <button onClick={() => generateExcel(quoteData, equipment)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
          <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
          <div><div className="font-semibold">Excel Spreadsheet</div><div className="text-xs text-gray-500">Financial model</div></div>
        </button>
      </div>
    </div>
  );
}

function RFQModal({
  rfqForm, setRfqForm, rfqType, rfqSubmitting, rfqSuccess, wizardState, premiumConfig, premiumComparison, onSubmit, onClose
}: {
  rfqForm: RFQFormState; setRfqForm: React.Dispatch<React.SetStateAction<RFQFormState>>;
  rfqType: 'standard' | 'premium'; rfqSubmitting: boolean; rfqSuccess: string | null;
  wizardState: WizardState; premiumConfig: PremiumConfiguration | null; premiumComparison: PremiumComparison | null;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 border-b ${rfqType === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              {rfqType === 'premium' ? <Crown className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
              <div>
                <h2 className="text-xl font-bold">{rfqType === 'premium' ? 'Request Premium Quotes' : 'Get Vendor Quotes'}</h2>
                <p className="text-sm opacity-90">Verified vendors respond within {rfqType === 'premium' ? '14' : '7'} days</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {rfqSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Quote Request Submitted!</h3>
            <p className="text-gray-600 mb-6">{rfqSuccess}</p>
            <button onClick={onClose} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold">Done</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input type="text" value={rfqForm.projectName} onChange={(e) => setRfqForm(prev => ({ ...prev, projectName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input type="text" value={rfqForm.customerName} onChange={(e) => setRfqForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={rfqForm.customerPhone} onChange={(e) => setRfqForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={rfqForm.customerEmail} onChange={(e) => setRfqForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
              <select value={rfqForm.projectTimeline} onChange={(e) => setRfqForm(prev => ({ ...prev, projectTimeline: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="immediate">Ready to start immediately</option>
                <option value="3-months">Within 3 months</option>
                <option value="6-months">Within 6 months</option>
                <option value="12-months">Within 12 months</option>
              </select>
            </div>

            <div className={`rounded-xl p-4 ${rfqType === 'premium' ? 'bg-amber-50 border border-amber-200' : 'bg-purple-50 border border-purple-200'}`}>
              <h4 className={`font-bold mb-2 ${rfqType === 'premium' ? 'text-amber-800' : 'text-purple-800'}`}>Quote Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">System Size:</div><div className="font-medium">{wizardState.batteryKWh.toLocaleString()} kWh</div>
                <div className="text-gray-600">Location:</div><div className="font-medium">{wizardState.state}</div>
                <div className="text-gray-600">Use Case:</div><div className="font-medium">{wizardState.industryName}</div>
              </div>
            </div>

            <button type="submit" disabled={rfqSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50
                ${rfqType === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'}`}>
              {rfqSubmitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <><Mail className="w-5 h-5" />Submit Quote Request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
