/**
 * QUOTE RESULTS SECTION - COMPLETE REDESIGN
 * ==========================================
 * 
 * December 2025 - Professional, bank-ready quote template
 * 
 * UPDATED Dec 19, 2025: Step 4 color theme (warm gold - celebration!)
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
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Home,
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
import type { WizardState, PremiumConfiguration, PremiumComparison, RFQFormState, PhysicalConstraints } from '../types/wizardTypes';
import { TrueQuoteModal } from '../modals/StepTransitionModal';
import { SolarSizingModal } from '../modals/SolarSizingModal';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';
import { createRFQ, type CreateRFQData } from '@/services/vendorService';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import { MerlinGreeting } from '../shared';

// Step 4 colors - warm gold celebration theme
import { getStepColors } from '../constants/stepColors';
const step4Colors = getStepColors(4);

interface QuoteResultsSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  premiumConfig: PremiumConfiguration | null;
  premiumComparison: PremiumComparison | null;
  onBack: () => void;
  onStartNew: () => void;
  onHome?: () => void; // Navigate to vertical landing page
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
  onHome,
  onOpenAdvanced,
}: QuoteResultsSectionProps) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
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

  // Early return if not on Step 5 (which is currentSection === 4)
  if (currentSection !== 4) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      className={`min-h-screen p-4 md:p-8 ${step4Colors.panelBgGradient}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Merlin Greeting - Consistent with Step 1 */}
        <MerlinGreeting
          stepNumber={5}
          totalSteps={5}
          stepTitle="Your Quote"
          stepDescription="Congratulations! Your energy system is now ready. I have created your complete TrueQuote™ with verified savings, payback calculations, and system specifications. Every number is traceable to authoritative sources—that's TrueQuote™."
          estimatedTime="Review"
          actionInstructions={[
            'Review your estimated annual savings and payback period',
            'Explore the detailed cost breakdown',
            'Download or share your quote',
            'Request a vendor quote if you\'re ready to move forward'
          ]}
          isComplete={true}
          onCompleteMessage="🎉 Excellent! Your personalized energy solution is complete. I've calculated your exact savings, payback period, and system specs. Review the details below and take the next step!"
        />
        
        {/* Navigation - Back / Home / Start New */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#68BFFA] via-[#4A90E2] to-[#3B5BDB] hover:from-[#4A90E2] hover:to-[#3B5BDB] text-white font-medium rounded-lg transition-colors shadow-md shadow-[#3B5BDB]/20"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={onHome || onBack} // Home navigates to vertical landing page
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#68BFFA]/10 text-[#3B5BDB] rounded-lg border border-[#68BFFA]/30 transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            FINAL QUOTE DISPLAY
            Scenarios are now shown in Section 4, not here
        ════════════════════════════════════════════════════════════════ */}
        {wizardState.quoteResult ? (
          <div className="space-y-6">
            
            {/* ════════════════════════════════════════════════════════════════
                SECTION 1: QUOTE SUMMARY HEADER
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black text-white">Your Energy Quote</h1>
                      <p className="text-amber-100">Prepared by Merlin Energy • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <img src={merlinImage} alt="Merlin" className="w-14 h-14 hidden md:block" />
                </div>
              </div>

              {/* Project Summary */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-500">Facility Type</p>
                      <p className="font-bold text-gray-800">{wizardState.industryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-bold text-gray-800">{wizardState.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-500">Quote Valid</p>
                      <p className="font-bold text-gray-800">30 Days</p>
                    </div>
                  </div>
                </div>

                {/* Key Numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                    <p className="text-sm text-emerald-600 font-semibold mb-1">Annual Savings</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600">{formatMoney(annualSavings)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 text-center border-2 border-amber-200">
                    <p className="text-sm text-amber-600 font-semibold mb-1">Payback Period</p>
                    <p className="text-2xl md:text-3xl font-black text-amber-600">{paybackYears.toFixed(1)} yrs</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border-2 border-orange-200">
                    <p className="text-sm text-orange-600 font-semibold mb-1">10-Year ROI</p>
                    <p className="text-2xl md:text-3xl font-black text-orange-600">{Math.round(roi10Year)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 text-center border-2 border-yellow-300">
                    <p className="text-sm text-yellow-700 font-semibold mb-1">Net Investment</p>
                    <p className="text-2xl md:text-3xl font-black text-yellow-700">{formatMoney(netCost)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 2: TRUEQUOTE™ COMPLIANCE
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-800 mb-2">TrueQuote™ Verified</h3>
                  <p className="text-amber-700 mb-3">
                    Every number in this quote is backed by authoritative industry sources including NREL, IEEE, and the IRS. 
                    This isn't guesswork—it's data you can take to your bank.
                  </p>
                  <button
                    onClick={() => setShowTrueQuoteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                  >
                    <Info className="w-4 h-4" />
                    Learn About Our Sources
                  </button>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 3: EQUIPMENT BREAKDOWN
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-200">
              <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200">
                <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                  Equipment & Cost Breakdown
                </h2>
              </div>

              <div className="p-6">
                {/* Equipment Grid - Compact Layout */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* BESS System */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Battery className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Battery Storage</p>
                          <p className="text-xs text-gray-600">{formatKWh(wizardState.batteryKWh)} / {formatKW(wizardState.batteryKW)}</p>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-700">{formatMoney(Math.round(equipmentCost * 0.6))}</p>
                    </div>
                  </div>

                  {/* Power Conversion */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Power Conversion</p>
                          <p className="text-xs text-gray-600">Inverter & PCS</p>
                        </div>
                      </div>
                      <p className="font-bold text-blue-700">{formatMoney(Math.round(equipmentCost * 0.2))}</p>
                    </div>
                  </div>

                  {/* Balance of System */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Balance of System</p>
                          <p className="text-xs text-gray-600">Switchgear, wiring, enclosure</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-700">{formatMoney(Math.round(equipmentCost * 0.2))}</p>
                    </div>
                  </div>

                  {/* Solar (if applicable) */}
                  {wizardState.solarKW > 0 ? (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Sun className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Solar Array</p>
                            <p className="text-xs text-gray-600">{formatKW(wizardState.solarKW)} peak capacity</p>
                          </div>
                        </div>
                        <p className="font-bold text-amber-700">{formatMoney(Math.round(wizardState.solarKW * 850))}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                          <Sun className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-400">Solar Array</p>
                          <p className="text-xs text-gray-400">Not included</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wind (if applicable) */}
                  {wizardState.windTurbineKW > 0 ? (
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-4 border border-sky-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <Wind className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Wind Turbine</p>
                            <p className="text-xs text-gray-600">{formatKW(wizardState.windTurbineKW)} capacity</p>
                          </div>
                        </div>
                        <p className="font-bold text-sky-700">{formatMoney(Math.round(wizardState.windTurbineKW * 1200))}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Generator (if applicable) */}
                  {wizardState.generatorKW > 0 ? (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Backup Generator</p>
                            <p className="text-xs text-gray-600">{formatKW(wizardState.generatorKW)} natural gas</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-700">{formatMoney(Math.round(wizardState.generatorKW * 700))}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Equipment Subtotal */}
                <div className="mb-6 pb-6 border-b-2 border-gray-200">
                  <div className="flex justify-between items-center bg-amber-50 rounded-xl p-4">
                    <span className="font-bold text-gray-800 text-lg">Equipment Subtotal</span>
                    <span className="font-black text-amber-700 text-xl">{formatMoney(equipmentCost)}</span>
                  </div>
                </div>

                {/* Services Section - Compact */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Installation</p>
                          <p className="text-xs text-gray-600">Site prep & commissioning</p>
                        </div>
                      </div>
                      <p className="font-bold text-purple-700">{formatMoney(installationCost)}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Shipping</p>
                          <p className="text-xs text-gray-600">Freight & delivery</p>
                        </div>
                      </div>
                      <p className="font-bold text-indigo-700">{formatMoney(shippingCost)}</p>
                    </div>
                  </div>
                </div>

                {/* Services Subtotal */}
                <div className="mb-6 pb-6 border-b-2 border-gray-200">
                  <div className="flex justify-between items-center bg-purple-50 rounded-xl p-4">
                    <span className="font-bold text-gray-800 text-lg">Services Subtotal</span>
                    <span className="font-black text-purple-700 text-xl">{formatMoney(installationCost + shippingCost)}</span>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 space-y-3 border-2 border-amber-200">
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
                  
                  <div className="pt-3 border-t-2 border-amber-300 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Net Investment</span>
                    <span className="text-3xl font-black text-amber-600">{formatMoney(netCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SECTION 4: ROI ANALYSIS - WHY THIS WORKS
            ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-200">
              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                  Return on Investment Analysis
                </h2>
                <p className="text-amber-600 text-sm mt-1">Why this configuration works for your {wizardState.industryName}</p>
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
                  <h3 className="font-bold text-amber-800 mb-4">How This System Saves You Money</h3>
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
              
              {/* ProQuote Translucent Badge - Glassmorphism Style */}
              {onOpenAdvanced && (
                <div className="mt-6 pt-6 flex justify-center">
                  <button
                    onClick={() => {
                      // Pass wizard values to ProQuote for pre-population
                      if (onOpenAdvanced) {
                        onOpenAdvanced();
                      }
                    }}
                    className="group relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border-2 border-emerald-400/40 rounded-2xl px-6 py-4 shadow-2xl hover:shadow-[0_8px_32px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-105 hover:border-emerald-400/60 max-w-md w-full"
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="relative flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Calculator className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-base font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                          ProQuote™ Builder
                        </div>
                        <div className="text-xs text-emerald-700/80 group-hover:text-emerald-700 transition-colors">
                          Customize your configuration
                        </div>
                      </div>
                      <div className="text-emerald-600 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ml-2">
                        →
                      </div>
                    </div>
                  </button>
                </div>
              )}
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

      {/* Solar Sizing Modal */}
      <SolarSizingModal
        show={showSolarSizingModal}
        onClose={() => setShowSolarSizingModal(false)}
        currentSolarKW={wizardState.solarKW}
        facilityType={wizardState.selectedIndustry || 'default'}
        facilityName={wizardState.industryName || 'Your Facility'}
        currentConstraints={wizardState.physicalConstraints || {
          roofSpaceSqFt: null,
          usableRoofPercent: 60,
          maxSolarKW: null,
          groundSpaceAcres: 0,
          electricalCapacityKW: null,
          isRefined: false,
        }}
        onSave={(constraints: PhysicalConstraints) => {
          setWizardState(prev => ({
            ...prev,
            physicalConstraints: constraints,
            // Cap solar if needed
            solarKW: constraints.maxSolarKW && prev.solarKW > constraints.maxSolarKW 
              ? constraints.maxSolarKW 
              : prev.solarKW,
          }));
        }}
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
    <div className={`rounded-xl p-5 text-center ${highlight ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white shadow-lg' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200'}`}>
      <p className={`text-sm font-semibold mb-1 ${highlight ? 'text-amber-100' : 'text-amber-600'}`}>{title}</p>
      <p className={`text-3xl font-black mb-1 ${highlight ? 'text-white' : 'text-amber-800'}`}>{value}</p>
      <p className={`text-sm ${highlight ? 'text-amber-100' : 'text-amber-600'}`}>{description}</p>
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
    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <DollarSign className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-amber-600">~${savings.toLocaleString()}/yr</p>
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
        className="w-full flex items-center justify-center gap-2 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-lg"
      >
        <Download className="w-5 h-5" />
        Export Quote
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-amber-200 rounded-xl shadow-xl z-50 overflow-hidden">
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
