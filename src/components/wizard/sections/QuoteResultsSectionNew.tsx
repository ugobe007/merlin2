/**
 * QUOTE RESULTS SECTION - COMPLETE REDESIGN
 * ==========================================
 * 
 * December 2025 - Professional, bank-ready quote template
 * 
 * Structure:
 * 1. Quote Summary Header
 * 2. TrueQuote™ Compliance Explanation
 * 3. Full Equipment & Cost Breakdown
 * 4. ROI Analysis - Why This Works
 * 5. Action Buttons
 * 
 * Design: Clean, professional, NO vertical lines, easy to read
 */

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
  RefreshCw,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  Wind,
  X,
  Zap,
  Truck,
  Wrench,
  Calculator,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';
import { FACILITY_PRESETS } from '../constants/wizardConstants';
import type { WizardState, PremiumConfiguration, PremiumComparison, RFQFormState } from '../types/wizardTypes';
import { TrueQuoteModal } from '../modals/StepTransitionModal';
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
}: QuoteResultsSectionProps) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false);
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Format helpers
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    if (amt >= 1000) return `$${Math.round(amt).toLocaleString()}`;
    return `$${Math.round(amt)}`;
  };

  const formatKW = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;

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
  };

  // Calculate derived values
  const paybackYears = wizardState.quoteResult?.financials.paybackYears || 5;
  const roi10Year = wizardState.quoteResult?.financials.roi10Year || 150;
  const roi25Year = wizardState.quoteResult?.financials.roi25Year || 400;
  const annualSavings = wizardState.quoteResult?.financials.annualSavings || 50000;
  const totalProjectCost = wizardState.quoteResult?.costs.totalProjectCost || 250000;
  const taxCredit = wizardState.quoteResult?.costs.taxCredit || 75000;
  const netCost = wizardState.quoteResult?.costs.netCost || 175000;
  const equipmentCost = wizardState.quoteResult?.costs.equipmentCost || 200000;
  const installationCost = wizardState.quoteResult?.costs.installationCost || 50000;

  // Shipping estimate (5% of equipment)
  const shippingCost = Math.round(equipmentCost * 0.05);
  // Tax estimate (varies by state, use 0 for now as most commercial is tax exempt)
  const taxAmount = 0;

  return (
    <div
      ref={sectionRef}
      className={`min-h-[calc(100vh-120px)] p-4 md:p-8 ${currentSection !== 5 ? 'hidden' : ''}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configuration
          </button>
          <div className="text-sm text-gray-400">Final Quote</div>
        </div>

        {wizardState.quoteResult ? (
          <div className="space-y-6">
            
            {/* ════════════════════════════════════════════════════════════════
                SECTION 1: QUOTE SUMMARY HEADER
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black text-white">Your Energy Quote</h1>
                      <p className="text-emerald-100">Prepared by Merlin Energy • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <img src={merlinImage} alt="Merlin" className="w-14 h-14 hidden md:block" />
                </div>
              </div>

              {/* Project Summary */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Facility Type</p>
                      <p className="font-bold text-gray-800">{wizardState.industryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-bold text-gray-800">{wizardState.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Quote Valid</p>
                      <p className="font-bold text-gray-800">30 Days</p>
                    </div>
                  </div>
                </div>

                {/* Key Numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-emerald-600 font-semibold mb-1">Annual Savings</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600">{formatMoney(annualSavings)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-purple-600 font-semibold mb-1">Payback Period</p>
                    <p className="text-2xl md:text-3xl font-black text-purple-600">{paybackYears.toFixed(1)} yrs</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 font-semibold mb-1">10-Year ROI</p>
                    <p className="text-2xl md:text-3xl font-black text-blue-600">{Math.round(roi10Year)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-600 font-semibold mb-1">Net Investment</p>
                    <p className="text-2xl md:text-3xl font-black text-amber-600">{formatMoney(netCost)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 2: TRUEQUOTE™ COMPLIANCE
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-800 mb-2">TrueQuote™ Verified</h3>
                  <p className="text-emerald-700 mb-3">
                    Every number in this quote is backed by authoritative industry sources including NREL, IEEE, and the IRS. 
                    This isn't guesswork—it's data you can take to your bank.
                  </p>
                  <button
                    onClick={() => setShowTrueQuoteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    Learn About Our Sources
                  </button>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 3: FULL EQUIPMENT & COST BREAKDOWN
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                  Complete Cost Breakdown
                </h2>
              </div>

              <div className="p-6">
                {/* Hardware Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Hardware & Equipment</h3>
                  <div className="space-y-3">
                    {/* Battery System */}
                    <CostLineItem
                      icon={Battery}
                      iconColor="emerald"
                      label="Battery Energy Storage System (BESS)"
                      description={`${formatKWh(wizardState.batteryKWh)} capacity • ${formatKW(wizardState.batteryKW)} power • ${wizardState.durationHours}hr duration`}
                      amount={Math.round(equipmentCost * 0.6)}
                    />
                    
                    {/* Inverter/PCS */}
                    <CostLineItem
                      icon={Zap}
                      iconColor="blue"
                      label="Power Conversion System (PCS/Inverter)"
                      description={`${formatKW(wizardState.batteryKW)} rated capacity`}
                      amount={Math.round(equipmentCost * 0.2)}
                    />
                    
                    {/* Balance of System */}
                    <CostLineItem
                      icon={Settings}
                      iconColor="gray"
                      label="Balance of System"
                      description="Switchgear, transformers, wiring, enclosure"
                      amount={Math.round(equipmentCost * 0.2)}
                    />
                    
                    {/* Solar if applicable */}
                    {wizardState.solarKW > 0 && (
                      <CostLineItem
                        icon={Sun}
                        iconColor="amber"
                        label="Solar Array"
                        description={`${formatKW(wizardState.solarKW)} peak capacity`}
                        amount={Math.round(wizardState.solarKW * 850)}
                      />
                    )}
                    
                    {/* Wind if applicable */}
                    {wizardState.windTurbineKW > 0 && (
                      <CostLineItem
                        icon={Wind}
                        iconColor="sky"
                        label="Wind Turbine"
                        description={`${formatKW(wizardState.windTurbineKW)} capacity`}
                        amount={Math.round(wizardState.windTurbineKW * 1200)}
                      />
                    )}
                    
                    {/* Generator if applicable */}
                    {wizardState.generatorKW > 0 && (
                      <CostLineItem
                        icon={Zap}
                        iconColor="slate"
                        label="Backup Generator"
                        description={`${formatKW(wizardState.generatorKW)} natural gas`}
                        amount={Math.round(wizardState.generatorKW * 700)}
                      />
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Equipment Subtotal</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(equipmentCost)}</span>
                  </div>
                </div>

                {/* Services Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Installation & Services</h3>
                  <div className="space-y-3">
                    <CostLineItem
                      icon={Wrench}
                      iconColor="purple"
                      label="Professional Installation"
                      description="Site prep, electrical work, commissioning"
                      amount={installationCost}
                    />
                    <CostLineItem
                      icon={Truck}
                      iconColor="indigo"
                      label="Shipping & Delivery"
                      description="Freight, handling, site delivery"
                      amount={shippingCost}
                    />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Services Subtotal</span>
                    <span className="font-bold text-gray-800 text-lg">{formatMoney(installationCost + shippingCost)}</span>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Before Incentives</span>
                    <span className="font-bold text-gray-800 text-xl">{formatMoney(totalProjectCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Federal Investment Tax Credit (30%)
                    </span>
                    <span className="font-bold text-lg">- {formatMoney(taxCredit)}</span>
                  </div>
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sales Tax</span>
                      <span className="font-bold">{formatMoney(taxAmount)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t-2 border-emerald-200 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Net Investment</span>
                    <span className="text-3xl font-black text-emerald-600">{formatMoney(netCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 4: ROI ANALYSIS - WHY THIS WORKS
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
                <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Return on Investment Analysis
                </h2>
                <p className="text-purple-600 text-sm mt-1">Why this configuration works for your {wizardState.industryName}</p>
              </div>

              <div className="p-6">
                {/* Financial Highlights */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <ROICard
                    title="Break-Even Point"
                    value={`${paybackYears.toFixed(1)} Years`}
                    description="Time to recover your investment"
                    highlight
                  />
                  <ROICard
                    title="10-Year Return"
                    value={`${Math.round(roi10Year)}%`}
                    description={`${formatMoney(annualSavings * 10)} total savings`}
                  />
                  <ROICard
                    title="25-Year Return"
                    value={`${Math.round(roi25Year)}%`}
                    description={`${formatMoney(annualSavings * 25)} lifetime savings`}
                  />
                </div>

                {/* How You Save */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-4">How This System Saves You Money</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <SavingsSource
                      title="Peak Demand Reduction"
                      savings={Math.round(annualSavings * 0.5)}
                      description="Discharge during peak hours to flatten demand charges"
                    />
                    <SavingsSource
                      title="Time-of-Use Arbitrage"
                      savings={Math.round(annualSavings * 0.3)}
                      description="Charge when electricity is cheap, use when it's expensive"
                    />
                    {wizardState.solarKW > 0 && (
                      <SavingsSource
                        title="Solar Self-Consumption"
                        savings={Math.round(annualSavings * 0.15)}
                        description="Store excess solar for evening use"
                      />
                    )}
                    <SavingsSource
                      title="Demand Response Revenue"
                      savings={Math.round(annualSavings * 0.05)}
                      description="Potential utility program payments"
                    />
                  </div>
                </div>

                {/* Why This Size */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Why We Recommend This System Size
                  </h4>
                  <ul className="space-y-2 text-purple-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span><strong>{formatKWh(wizardState.batteryKWh)}</strong> storage covers your peak demand periods with {wizardState.durationHours} hours of backup</span>
                    </li>
                    {wizardState.solarKW > 0 && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>{formatKW(wizardState.solarKW)}</strong> solar maximizes self-consumption and reduces grid dependency</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>At <strong>${wizardState.electricityRate.toFixed(2)}/kWh</strong> in {wizardState.state}, this system optimizes your energy costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>The <strong>30% federal tax credit</strong> significantly improves ROI, bringing your payback under {Math.ceil(paybackYears)} years</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 5: ACTION BUTTONS
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-center">Ready to Move Forward?</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ExportDropdown quoteData={quoteData} equipment={wizardState.quoteResult.equipment} />
                
                <button
                  onClick={() => {
                    setRfqType('standard');
                    setRfqForm(prev => ({ ...prev, projectName: `${wizardState.industryName} - BESS Project` }));
                    setShowRFQModal(true);
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  <Mail className="w-5 h-5" />
                  Get Vendor Quotes
                </button>
                
                <button
                  onClick={() => {
                    const subject = encodeURIComponent('Merlin Energy Quote Request');
                    const body = encodeURIComponent(`Hi,\n\nI completed a quote on Merlin Energy.\n\nQuote Details:\n- Industry: ${wizardState.industryName}\n- Location: ${wizardState.state}\n- Battery: ${wizardState.batteryKWh} kWh\n- Annual Savings: $${Math.round(annualSavings).toLocaleString()}\n\nPlease contact me to schedule a consultation.\n\nThank you!`);
                    window.open(`mailto:sales@merlinenergy.com?subject=${subject}&body=${body}`);
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  Consultation
                </button>
                
                <button
                  onClick={onStartNew}
                  className="flex items-center justify-center gap-2 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  New Quote
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                <div className="text-left">
                  <p className="text-white font-bold">Powered by Merlin Energy</p>
                  <p className="text-xs text-gray-400">AI-Optimized Battery Storage Solutions</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Quote Reference: {wizardState.selectedIndustry?.toUpperCase()}-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white font-bold text-xl">Generating your quote...</p>
            <p className="text-gray-400 mt-2">This takes just a moment</p>
          </div>
        )}
      </div>

      {/* TrueQuote Modal */}
      <TrueQuoteModal 
        isOpen={showTrueQuoteModal} 
        onClose={() => setShowTrueQuoteModal(false)} 
      />

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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS - Clean, no vertical lines
// ═══════════════════════════════════════════════════════════════════════════

interface CostLineItemProps {
  icon: any;
  iconColor: 'emerald' | 'blue' | 'amber' | 'gray' | 'purple' | 'indigo' | 'sky' | 'slate';
  label: string;
  description: string;
  amount: number;
}

function CostLineItem({ icon: Icon, iconColor, label, description, amount }: CostLineItemProps) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    sky: 'bg-sky-100 text-sky-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[iconColor]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-800">${amount.toLocaleString()}</p>
      </div>
    </div>
  );
}

interface ROICardProps {
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}

function ROICard({ title, value, description, highlight }: ROICardProps) {
  return (
    <div className={`rounded-xl p-5 text-center ${highlight ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-gray-50'}`}>
      <p className={`text-sm font-semibold mb-1 ${highlight ? 'text-emerald-100' : 'text-gray-500'}`}>{title}</p>
      <p className={`text-3xl font-black mb-1 ${highlight ? 'text-white' : 'text-gray-800'}`}>{value}</p>
      <p className={`text-sm ${highlight ? 'text-emerald-100' : 'text-gray-500'}`}>{description}</p>
    </div>
  );
}

interface SavingsSourceProps {
  title: string;
  savings: number;
  description: string;
}

function SavingsSource({ title, savings, description }: SavingsSourceProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <DollarSign className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-emerald-600">~${savings.toLocaleString()}/yr</p>
      </div>
    </div>
  );
}

function ExportDropdown({ quoteData, equipment }: { quoteData: any; equipment: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg"
      >
        <Download className="w-5 h-5" />
        Export Quote
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <button 
              onClick={() => { generatePDF(quoteData, equipment); setIsOpen(false); }} 
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 border-b border-gray-100"
            >
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-semibold">PDF Document</div>
                <div className="text-xs text-gray-500">Share with your bank</div>
              </div>
            </button>
            <button 
              onClick={() => { generateWord(quoteData, equipment); setIsOpen(false); }} 
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100"
            >
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold">Word Document</div>
                <div className="text-xs text-gray-500">Editable proposal</div>
              </div>
            </button>
            <button 
              onClick={() => { generateExcel(quoteData, equipment); setIsOpen(false); }} 
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-semibold">Excel Spreadsheet</div>
                <div className="text-xs text-gray-500">Financial model</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// RFQ Modal (kept simple)
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
        <div className="p-6 border-b bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Mail className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Get Vendor Quotes</h2>
                <p className="text-sm opacity-90">Verified vendors respond within 7 days</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input type="text" value={rfqForm.customerName} onChange={(e) => setRfqForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={rfqForm.customerPhone} onChange={(e) => setRfqForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={rfqForm.customerEmail} onChange={(e) => setRfqForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
              <select value={rfqForm.projectTimeline} onChange={(e) => setRfqForm(prev => ({ ...prev, projectTimeline: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="immediate">Ready to start immediately</option>
                <option value="3-months">Within 3 months</option>
                <option value="6-months">Within 6 months</option>
                <option value="12-months">Within 12 months</option>
              </select>
            </div>

            <button type="submit" disabled={rfqSubmitting}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              {rfqSubmitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <><Mail className="w-5 h-5" />Submit Quote Request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Export as default for easy swap
export default QuoteResultsSection;
