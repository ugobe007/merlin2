/**
 * STEP 5: Quote Review - REDESIGNED
 * ==================================
 * Premium quote presentation with celebration design
 * 
 * Design: Dark electric aesthetic with glowing accents
 * Based on step5-quote-redesign.html mockup
 */

import React, { useState, useEffect } from 'react';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';
import badgeGoldIcon from '@/assets/images/badge_gold_icon.jpg';
import badgeIcon from '@/assets/images/badge_icon.jpg';
import { 
  Sparkles, Battery, Sun, DollarSign, TrendingUp, 
  Calendar, Download, FileText, Mail, Check,
  ChevronDown, ChevronUp, ExternalLink, Shield,
  Award, Zap, Clock, Info, FileSpreadsheet, Star,
  Settings
} from 'lucide-react';
import { COLORS } from '../design-system';
import { QuoteEngine } from '@/core/calculations';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';
import { CalculationValidator } from '@/services/calculationValidator';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';

interface Step5Props {
  state: string;
  selectedIndustry: string;
  industryName: string;
  goals: string[];
  useCaseData: Record<string, any>;
  batteryKW: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;
  gridConnection: 'on-grid' | 'off-grid' | 'limited';
  electricityRate: number;
  quoteResult: QuoteResult | null;
  onQuoteGenerated: (quote: QuoteResult) => void;
}

export const Step5QuoteReview: React.FC<Step5Props> = ({
  state,
  selectedIndustry,
  industryName,
  goals,
  useCaseData,
  batteryKW,
  durationHours,
  solarKW,
  generatorKW,
  gridConnection,
  electricityRate,
  quoteResult,
  onQuoteGenerated,
}) => {
  const [loading, setLoading] = useState(!quoteResult);
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    score: number;
    warnings: { message: string; severity: string }[];
  } | null>(null);

  // Animated counter state
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [animatedNetCost, setAnimatedNetCost] = useState(0);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // Generate quote on mount
  useEffect(() => {
    const generateQuote = async () => {
      if (quoteResult) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await QuoteEngine.generateQuote({
          storageSizeMW: batteryKW / 1000,
          durationHours,
          location: state,
          electricityRate: electricityRate || 0.12,
          useCase: selectedIndustry,
          solarMW: solarKW / 1000,
          generatorMW: generatorKW / 1000,
          gridConnection,
        });
        
        onQuoteGenerated(result);
        setLoading(false);
      } catch (err) {
        console.error('Failed to generate quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate quote.');
        setLoading(false);
      }
    };

    generateQuote();
  }, [batteryKW, durationHours, state, selectedIndustry, solarKW, generatorKW, gridConnection, electricityRate, quoteResult, onQuoteGenerated]);

  // Animate numbers on load
  useEffect(() => {
    if (!quoteResult) return;
    
    const totalCost = quoteResult.costs?.totalProjectCost || 0;
    const annualSavings = quoteResult.financials?.annualSavings || 0;
    const netCost = quoteResult.costs?.netCost || 0;
    
    // Animate over 1.5 seconds
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setAnimatedTotal(Math.round(totalCost * eased));
      setAnimatedSavings(Math.round(annualSavings * eased));
      setAnimatedNetCost(Math.round(netCost * eased));
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, [quoteResult]);

  // Validate quote
  useEffect(() => {
    if (!quoteResult) return;
    
    const validateQuote = async () => {
      try {
        const result = await CalculationValidator.validateQuote(
          quoteResult,
          {
            storageSizeMW: batteryKW / 1000,
            durationHours,
            solarMW: solarKW / 1000,
            generatorMW: generatorKW / 1000,
            location: state,
            useCase: selectedIndustry,
            electricityRate,
          },
          { logToDatabase: false }
        );
        setValidationResult(result);
      } catch (err) {
        console.error('Validation failed:', err);
      }
    };
    
    validateQuote();
  }, [quoteResult, batteryKW, durationHours, solarKW, generatorKW, state, selectedIndustry, electricityRate]);

  // Extract data
  const costs = quoteResult?.costs;
  const financials = quoteResult?.financials;
  const equipment = quoteResult?.equipment;
  const sources = quoteResult?.benchmarkAudit?.sources || [];

  // Prepare export data
  const quoteData = {
    storageSizeMW: batteryKW / 1000,
    durationHours,
    solarMW: solarKW / 1000,
    windMW: 0,
    generatorMW: generatorKW / 1000,
    location: state,
    industryTemplate: selectedIndustry || 'commercial',
    gridConnection,
    totalProjectCost: costs?.totalProjectCost || 0,
    annualSavings: financials?.annualSavings || 0,
    paybackYears: financials?.paybackYears || 0,
    taxCredit: costs?.taxCredit || 0,
    netCost: costs?.netCost || 0,
    installationOption: 'epc',
    shippingOption: 'standard',
    financingOption: 'cash',
    equipmentCost: costs?.equipmentCost || 0,
    installationCost: costs?.installationCost || 0,
  };

  // Export handlers
  const handleDownloadPDF = () => {
    if (!quoteResult) return;
    generatePDF(quoteData, equipment);
  };

  const handleDownloadWord = () => {
    if (!quoteResult) return;
    generateWord(quoteData, equipment);
  };

  const handleDownloadExcel = () => {
    if (!quoteResult) return;
    generateExcel(quoteData, equipment);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Generating Your TrueQuote™
          </h3>
          <p className="text-white/60">
            Calculating costs and savings...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
          <Info className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Quote Generation Failed</h3>
        <p className="text-white/60 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No quote state
  if (!quoteResult) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
          <Info className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Quote Available</h3>
        <p className="text-white/60">Please go back and check your inputs.</p>
      </div>
    );
  }

  const taxSavings = Math.round((costs?.totalProjectCost || 0) - (costs?.netCost || 0));
  const roi = financials?.roi25Year ? Math.round(financials.roi25Year) : financials?.roi10Year ? Math.round(financials.roi10Year) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6 pb-32">
      
      {/* ═══════════════════════════════════════════════════════════════
          MERLIN HERO CELEBRATION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="relative bg-gradient-to-r from-emerald-900/40 via-cyan-900/30 to-emerald-900/40 rounded-3xl p-8 border border-emerald-500/30 overflow-hidden">
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }}
          />
          
          <div className="relative flex items-center gap-6">
            {/* Merlin Avatar with glow */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-purple-500/40 rounded-full blur-2xl animate-pulse" />
              <img 
                src="/images/new_profile_merlin.png" 
                alt="Merlin" 
                className="w-28 h-28 object-contain relative z-10"
                style={{ filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.6))' }}
              />
              {/* Success badge */}
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#0a0a1a] shadow-lg z-20">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            </div>
            
            {/* Hero Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🎉</span>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  Your Perfect System is Ready!
                </h1>
              </div>
              <p className="text-white/80 text-lg">
                Based on your <span className="text-emerald-400 font-semibold">{Object.keys(useCaseData || {}).length} inputs</span>, I've designed a system that will 
                <span className="text-emerald-400 font-semibold"> save you ${animatedSavings.toLocaleString()}/year</span> and pay for itself in 
                <span className="text-amber-400 font-semibold"> just {financials?.paybackYears?.toFixed(1) || '4'} years</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setShowTrueQuoteModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all hover:scale-105 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
            borderColor: '#D97706',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
          }}
        >
          <img 
            src={badgeGoldIcon} 
            alt="TrueQuote"
            className="w-6 h-6 object-contain"
          />
          <span className="font-bold" style={{ color: '#FBBF24' }}>TrueQuote™ Verified</span>
        </button>
        {validationResult && validationResult.score >= 90 && (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/50">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">SSOT Certified</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN INVESTMENT CARD
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-3xl overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        boxShadow: '0 0 0 2px rgba(139,92,246,0.5), 0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <div className="bg-gradient-to-br from-purple-900/80 via-violet-900/60 to-indigo-900/80 p-8">
          {/* Header with investment */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-purple-300 text-sm font-medium uppercase tracking-wider mb-2">Total Investment</p>
              <div 
                className="text-5xl md:text-6xl font-black text-white"
                style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)' }}
              >
                ${animatedTotal.toLocaleString()}
              </div>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Annual Savings */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div 
                className="text-2xl md:text-3xl font-black text-emerald-400"
                style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
              >
                ${animatedSavings.toLocaleString()}
              </div>
              <div className="text-white/60 text-sm mt-1">Annual Savings</div>
            </div>
            
            {/* Payback Period */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div 
                className="text-2xl md:text-3xl font-black text-amber-400"
                style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}
              >
                {financials?.paybackYears?.toFixed(1) || '—'} yrs
              </div>
              <div className="text-white/60 text-sm mt-1">Payback Period</div>
            </div>
            
            {/* 25-Year ROI */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400">
                {roi}%
              </div>
              <div className="text-white/60 text-sm mt-1">25-Year ROI</div>
            </div>
          </div>
          
          {/* Tax Credit Savings Banner */}
          {taxSavings > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl p-6 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300/80 text-sm font-medium">After Federal Tax Credit (30% ITC)</p>
                  <div 
                    className="text-3xl md:text-4xl font-black text-emerald-400 mt-1"
                    style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                  >
                    ${animatedNetCost.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/30 rounded-full border border-emerald-400/50">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">You Save ${taxSavings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SYSTEM CONFIGURATION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Battery className="w-5 h-5 text-white" />
          </div>
          Your System Configuration
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Battery Storage */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-5 border border-emerald-500/20 text-center">
            <div className="text-4xl mb-2">🔋</div>
            <div className="text-3xl font-black text-white">{batteryKW}</div>
            <div className="text-emerald-400 text-sm font-medium">kWh Storage</div>
          </div>
          
          {/* Duration */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-5 border border-blue-500/20 text-center">
            <div className="text-4xl mb-2">⏱️</div>
            <div className="text-3xl font-black text-white">{durationHours}</div>
            <div className="text-blue-400 text-sm font-medium">Hour Duration</div>
          </div>
          
          {/* Solar (if configured) */}
          {solarKW > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20 text-center">
              <div className="text-4xl mb-2">☀️</div>
              <div className="text-3xl font-black text-white">{solarKW}</div>
              <div className="text-amber-400 text-sm font-medium">kW Solar</div>
            </div>
          )}
          
          {/* Grid Connection */}
          <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl p-5 border border-purple-500/20 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-xl font-bold text-white capitalize">{gridConnection}</div>
            <div className="text-purple-400 text-sm font-medium">Connection</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHY THIS CONFIGURATION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-3xl p-6 border border-purple-500/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          Why This Configuration is Perfect for You
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Peak Shaving - always show */}
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h4 className="font-bold text-white flex items-center gap-2">
                Peak Shaving Savings
                <Check className="w-4 h-4 text-emerald-400" />
              </h4>
              <p className="text-white/60 text-sm mt-1">Reduces demand charges by storing energy during off-peak hours</p>
            </div>
          </div>
          
          {/* Backup Power */}
          {(goals?.includes('backup_power') || goals?.includes('Backup Power') || durationHours >= 2) && (
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  Backup Power
                  <Check className="w-4 h-4 text-emerald-400" />
                </h4>
                <p className="text-white/60 text-sm mt-1">{durationHours} hours of backup keeps your {industryName || 'facility'} running during outages</p>
              </div>
            </div>
          )}
          
          {/* Solar Integration */}
          {solarKW > 0 && (
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">☀️</span>
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  Solar Integration
                  <Check className="w-4 h-4 text-emerald-400" />
                </h4>
                <p className="text-white/60 text-sm mt-1">{solarKW}kW solar maximizes your savings with {state}'s excellent sun</p>
              </div>
            </div>
          )}
          
          {/* Sustainability */}
          {(goals?.includes('sustainability') || goals?.includes('Sustainability')) && (
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  Sustainability
                  <Check className="w-4 h-4 text-emerald-400" />
                </h4>
                <p className="text-white/60 text-sm mt-1">Reduce your carbon footprint and meet ESG goals</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COST BREAKDOWN
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          Cost Breakdown
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/70">Equipment Cost</span>
            <span className="text-white font-semibold">${(costs?.equipmentCost || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-white/70">Installation</span>
            <span className="text-white font-semibold">${(costs?.installationCost || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/20">
            <span className="text-white font-medium">Subtotal</span>
            <span className="text-white font-bold">${(costs?.totalProjectCost || 0).toLocaleString()}</span>
          </div>
          
          {/* Tax Credit - Highlighted */}
          <div className="flex justify-between items-center py-4 px-4 -mx-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-400 font-medium">Federal Tax Credit (30% ITC)</span>
            <span className="text-emerald-400 font-bold text-lg">-${taxSavings.toLocaleString()}</span>
          </div>
          
          {/* Net Cost */}
          <div className="flex justify-between items-center py-4 mt-2">
            <span className="text-white text-xl font-bold">Net Investment</span>
            <span 
              className="text-3xl font-black text-purple-400"
              style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
            >
              ${animatedNetCost.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUEQUOTE SOURCES
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span style={{ color: '#FBBF24', fontWeight: 700 }}>TrueQuote™</span> Sources
            </h3>
            <ChevronDown className="w-5 h-5 text-white/50 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm text-white/60">
            <p>• NREL Annual Technology Baseline 2024</p>
            <p>• Lazard LCOS Analysis v8.0</p>
            <p>• EIA Commercial Electricity Rates</p>
            <p>• IRS Section 48 Investment Tax Credit Guidelines</p>
            {sources.map((source: any, i) => (
              <p key={i}>• {typeof source === "string" ? source : source.source || source.component || "Source"}</p>
            ))}
          </div>
        </details>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EXPORT OPTIONS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
          <Download className="w-5 h-5 text-purple-400" />
          Download Your Quote
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 font-medium transition-all border border-red-500/30"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleDownloadWord}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-300 font-medium transition-all border border-blue-500/30"
          >
            <FileText className="w-4 h-4" />
            Word
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-emerald-300 font-medium transition-all border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROQUOTE PANEL
      ═══════════════════════════════════════════════════════════════ */}
      <section 
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
        onClick={() => {
          sessionStorage.setItem('advancedBuilderConfig', JSON.stringify({
            batteryKW,
            durationHours,
            solarKW,
            generatorKW,
            state,
            selectedIndustry,
            electricityRate,
            useCaseData,
            goals,
          }));
          window.location.href = '/?advanced=true&view=custom-config';
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(49, 46, 129, 0.9) 100%)',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={badgeIcon} 
              alt="ProQuote Badge"
              className="w-12 h-12 object-contain"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
            />
            <div>
              <div className="text-white font-bold text-lg flex items-center gap-2">
                ProQuote™
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-medium">PRO</span>
              </div>
              <div className="text-indigo-300/80 text-sm">Advanced system configuration & custom pricing</div>
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-white text-lg">→</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ACTION BUTTONS
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => {
            // TODO: Implement quote request
            alert('Quote request feature coming soon!');
          }}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 rounded-xl text-white font-bold text-lg transition-all"
          style={{
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          Get My Quote
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3); }
        }
      `}</style>

      {/* TrueQuote Modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
      />
    </div>
  );
};

export default Step5QuoteReview;
