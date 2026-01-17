/**
 * TrueQuoteVerifyBadge.tsx - MERLIN REDESIGN
 * 
 * A magical verification badge that opens the TrueQuote Verification modal.
 * Fully integrated with Merlin's dark theme and magical aesthetic.
 * 
 * Design System:
 * - Primary: Purple gradients (from-purple-600 via-indigo-600 to-blue-600)
 * - Accent: Gold/Amber for verification (amber-400, yellow-500)
 * - Background: Dark slate with purple undertones (slate-900, purple-950)
 * - Success: Emerald (emerald-400)
 * - Warning: Orange (orange-400)
 * - Glass morphism effects with backdrop-blur
 * 
 * @version 2.0.0 - Merlin Redesign
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  AlertTriangle, 
  FileCheck, 
  Search, 
  Award,
  Sparkles,
  Zap,
  Star,
  BadgeCheck,
  ChevronRight,
  Info,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import { 
  calculateFinancialProjection, 
  formatProjectionForDisplay,
  type FinancialInputs 
} from '@/services/financialProjections';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (unchanged from original)
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrueQuoteWorksheetData {
  quoteId: string;
  generatedAt: string;
  engineVersion: string;
  
  inputs: {
    location: {
      zipCode: string;
      state: string;
      utilityTerritory: string;
      electricityRate: number;
      electricityRateSource: string;
      demandChargeRate: number;
      demandChargeSource: string;
      sunHours: number;
      sunHoursSource: string;
    };
    industry: {
      type: string;
      typeName: string;
      subtype: string;
      subtypeName: string;
      facilityDetails: Record<string, any>;
    };
  };
  
  calculationSteps: CalculationStep[];
  
  results: {
    peakDemandKW: number;
    bessKW: number;
    bessKWh: number;
    solarKWp?: number;
    generatorKW?: number;
    evChargingKW?: number;
    evChargers?: number;
    totalInvestment: number;
    federalITC: number;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
  };
  
  deviations: DeviationReport[];
  sources: SourceCitation[];
}

export interface CalculationStep {
  stepNumber: number;
  category: string;
  name: string;
  description: string;
  formula: string;
  calculation: string;
  inputs: { name: string; value: string | number; unit?: string; source: string }[];
  output: { name: string; value: number; unit: string };
  benchmark?: {
    source: string;
    range: string;
    status: 'pass' | 'warn' | 'fail';
  };
  notes?: string;
}

export interface DeviationReport {
  field: string;
  displayed: number;
  calculated: number;
  deviationPercent: number;
  severity: 'info' | 'warning' | 'critical';
  explanation: string;
  recommendation?: string;
}

export interface SourceCitation {
  id: string;
  shortName: string;
  fullName: string;
  url?: string;
  description?: string;
  dataPoints?: string[];
  organization?: string;
  year?: number;
  usedFor?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE COMPONENT - The clickable badge that opens the modal
// ═══════════════════════════════════════════════════════════════════════════════

interface TrueQuoteVerifyBadgeProps {
  quoteId: string;
  worksheetData: TrueQuoteWorksheetData | null;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const TrueQuoteVerifyBadge: React.FC<TrueQuoteVerifyBadgeProps> = ({
  quoteId,
  worksheetData,
  variant = 'full',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const hasDeviations = worksheetData?.deviations && worksheetData.deviations.length > 0;
  const criticalCount = worksheetData?.deviations?.filter(d => d.severity === 'critical').length || 0;
  const isVerified = !hasDeviations || criticalCount === 0;

  // Minimal badge for inline use
  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
            ${isVerified 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }
            hover:scale-105 transition-all cursor-pointer ${className}`}
        >
          {isVerified ? (
            <BadgeCheck className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold">TrueQuote™</span>
        </button>
        
        {isModalOpen && worksheetData && (
          <TrueQuoteModal 
            worksheetData={worksheetData} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </>
    );
  }

  // Compact badge for headers
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl
            bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20
            border border-purple-500/30 hover:border-purple-400/50
            backdrop-blur-sm transition-all duration-300
            hover:shadow-lg hover:shadow-purple-500/20 ${className}`}
        >
          {/* Animated glow */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 
            transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          {/* Shield icon */}
          <div className={`relative p-1.5 rounded-lg ${isVerified ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
            <Shield className={`w-4 h-4 ${isVerified ? 'text-emerald-400' : 'text-orange-400'}`} />
            {isVerified && (
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
            )}
          </div>
          
          {/* Text */}
          <div className="relative flex items-baseline gap-1">
            <span className="text-sm font-bold text-white">TrueQuote</span>
            <span className="text-amber-400 text-xs font-bold">™</span>
          </div>
          
          {/* Status indicator */}
          {isVerified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">{criticalCount}</span>
            </div>
          )}
          
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </button>
        
        {isModalOpen && worksheetData && (
          <TrueQuoteModal 
            worksheetData={worksheetData} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </>
    );
  }

  // Full badge - Main display version
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative w-full max-w-md mx-auto overflow-hidden rounded-2xl
          bg-gradient-to-br from-slate-800/90 via-purple-900/40 to-slate-800/90
          border-2 ${isVerified ? 'border-emerald-500/40' : 'border-orange-500/40'}
          backdrop-blur-xl transition-all duration-500
          hover:scale-[1.02] hover:shadow-2xl 
          ${isVerified ? 'hover:shadow-emerald-500/20' : 'hover:shadow-orange-500/20'}
          ${className}`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-cyan-600/5 to-purple-600/5 
          animate-gradient-x opacity-50" />
        
        {/* Sparkle effects */}
        {isVerified && (
          <>
            <div className="absolute top-2 right-4 animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-400/60" />
            </div>
            <div className="absolute bottom-3 left-6 animate-pulse delay-300">
              <Star className="w-3 h-3 text-purple-400/60" />
            </div>
          </>
        )}
        
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {/* Left: Merlin + Shield */}
            <div className="flex items-center gap-3">
              {/* Merlin Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 shadow-lg">
                  <img 
                    src={merlinImage} 
                    alt="Merlin" 
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                {/* Verification badge overlay */}
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full 
                  ${isVerified ? 'bg-emerald-500' : 'bg-orange-500'} shadow-lg`}>
                  {isVerified ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    TrueQuote
                  </span>
                  <span className="text-amber-400 text-sm font-bold">™</span>
                  <span className="text-purple-300 text-lg font-semibold ml-1">Verify</span>
                </div>
                <p className="text-xs text-slate-400">The Quote That Shows Its Work</p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold
              ${isVerified 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {isVerified ? '✓ Verified' : `${criticalCount} Issue${criticalCount > 1 ? 's' : ''}`}
            </div>
          </div>
          
          {/* Divider with glow */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-4" />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500">Sources</p>
              <p className="text-lg font-bold text-white">{worksheetData?.sources?.length || 0}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500">Steps</p>
              <p className="text-lg font-bold text-white">{worksheetData?.calculationSteps?.length || 0}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500">Quote ID</p>
              <p className="text-sm font-mono text-purple-300 truncate">{quoteId}</p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30
            border border-purple-500/30 group-hover:border-purple-400/50
            transition-all">
            <Search className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-semibold text-purple-200">View Full Verification</span>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>
      
      {isModalOpen && worksheetData && (
        <TrueQuoteModal 
          worksheetData={worksheetData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT - The full verification worksheet
// ═══════════════════════════════════════════════════════════════════════════════

interface TrueQuoteModalProps {
  worksheetData: TrueQuoteWorksheetData;
  onClose: () => void;
}

const TrueQuoteModal: React.FC<TrueQuoteModalProps> = ({ worksheetData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'steps' | 'sources' | 'financials'>('summary');
  const [animateIn, setAnimateIn] = useState(false);
  
  const hasDeviations = worksheetData.deviations && worksheetData.deviations.length > 0;
  const criticalDeviations = worksheetData.deviations?.filter(d => d.severity === 'critical') || [];
  const isVerified = !hasDeviations || criticalDeviations.length === 0;

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 50);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 
          ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col 
          bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900
          border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20
          transition-all duration-500 overflow-hidden
          ${animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full 
            bg-white/5 hover:bg-white/5 border border-white/10/50
            transition-all hover:scale-110"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER - Merlin Branded
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900 
          px-8 pt-6 pb-6 overflow-hidden flex-shrink-0">
          
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          
          {/* Sparkle decorations */}
          <div className="absolute top-4 left-8 animate-pulse">
            <Sparkles className="w-5 h-5 text-yellow-400/40" />
          </div>
          <div className="absolute top-8 right-16 animate-pulse delay-500">
            <Star className="w-4 h-4 text-purple-300/40" />
          </div>
          
          <div className="relative flex items-center gap-6">
            {/* Merlin Avatar with Shield */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-1 
                shadow-xl shadow-purple-500/30">
                <img 
                  src={merlinImage} 
                  alt="Merlin" 
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              {/* Verification shield */}
              <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-lg
                ${isVerified 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-orange-500 to-orange-600'
                }`}>
                <Shield className="w-5 h-5 text-white" />
                <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Title & Info */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-white">TrueQuote</span>
                <span className="text-amber-400 text-xl font-bold">™</span>
                <span className="text-2xl font-semibold text-purple-200 ml-2">Verify</span>
              </div>
              
              <p className="text-purple-300 text-sm mb-3">
                Every calculation traced. Every source cited. Fully transparent.
              </p>
              
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-medium">
                  Quote #{worksheetData.quoteId}
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-medium">
                  v{worksheetData.engineVersion}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold
                  ${isVerified 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                  {isVerified ? '✓ All Checks Passed' : `${criticalDeviations.length} Issue${criticalDeviations.length > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            DEVIATION ALERT (if any)
            ═══════════════════════════════════════════════════════════════════ */}
        {hasDeviations && (
          <div className={`px-6 py-3 flex items-center gap-3
            ${criticalDeviations.length > 0 
              ? 'bg-gradient-to-r from-red-900/30 to-red-800/20 border-b border-red-500/30' 
              : 'bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-b border-orange-500/30'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 
              ${criticalDeviations.length > 0 ? 'text-red-400' : 'text-orange-400'}`} 
            />
            <div className="flex-1">
              <p className={`text-sm font-semibold 
                ${criticalDeviations.length > 0 ? 'text-red-300' : 'text-orange-300'}`}>
                {criticalDeviations.length > 0 
                  ? `${criticalDeviations.length} Critical Deviation${criticalDeviations.length > 1 ? 's' : ''} Detected`
                  : `${worksheetData.deviations.length} Warning${worksheetData.deviations.length > 1 ? 's' : ''}`
                }
              </p>
              <p className={`text-xs ${criticalDeviations.length > 0 ? 'text-red-400/70' : 'text-orange-400/70'}`}>
                Review the details below to understand the differences.
              </p>
            </div>
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════
            TAB NAVIGATION
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex border-b border-purple-500/20 bg-[#0f1d33]/70 flex-shrink-0">
          {[
            { id: 'summary', label: 'Summary', icon: FileCheck },
            { id: 'steps', label: 'Calculation Steps', icon: Search },
            { id: 'sources', label: 'Sources', icon: Award },
            { id: 'financials', label: 'Financials', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 
                text-sm font-semibold transition-all border-b-2
                ${activeTab === tab.id 
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT AREA - Scrollable
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f1d33]/70/30 min-h-0">
          {activeTab === 'summary' && <SummaryTab worksheetData={worksheetData} />}
          {activeTab === 'steps' && <StepsTab steps={worksheetData.calculationSteps} />}
          {activeTab === 'sources' && <SourcesTab sources={worksheetData.sources} />}
          {activeTab === 'financials' && <FinancialsTab worksheetData={worksheetData} />}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-6 py-4 flex items-center justify-between 
          bg-gradient-to-r from-slate-800/50 to-purple-900/30 border-t border-purple-500/20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4" />
            <span>Generated {new Date(worksheetData.generatedAt).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 text-sm font-medium
              hover:bg-white/5 transition-colors border border-white/10">
              Export PDF
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 
                text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 
                transition-all shadow-lg shadow-purple-500/25"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONTENT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Summary Tab - UPDATED with Facility Configuration
const SummaryTab: React.FC<{ worksheetData: TrueQuoteWorksheetData }> = ({ worksheetData }) => {
  const { inputs, results, deviations, calculationSteps } = worksheetData;
  
  // Extract power demand steps to show base configuration
  const powerDemandSteps = calculationSteps.filter(step => step.category === 'power_demand');
  const baseLoadStep = powerDemandSteps.find(step => 
    step.name.toLowerCase().includes('base load') || 
    step.name.toLowerCase().includes('calculate base') ||
    step.name.toLowerCase().includes('sum charger')
  );
  const modifierSteps = powerDemandSteps.filter(step => 
    step.name.toLowerCase().includes('apply') || 
    step.name.toLowerCase().includes('add') ||
    step.name.toLowerCase().includes('modifier')
  );

  // Get facility details for display
  const facilityDetails = inputs.industry.facilityDetails || {};
  
  // Build a human-readable facility description
  const getFacilityDescription = () => {
    const type = inputs.industry.typeName || 'Facility';
    const subtype = inputs.industry.subtypeName;
    
    // Try to extract the main unit count (rooms, sqft, chargers, etc.)
    const unitFields = [
      { key: 'numberOfRooms', label: 'Room' },
      { key: 'roomCount', label: 'Room' },
      { key: 'rooms', label: 'Room' },
      { key: 'facilitySqFt', label: 'sq ft' },
      { key: 'squareFootage', label: 'sq ft' },
      { key: 'storeSqFt', label: 'sq ft' },
      { key: 'warehouseSqFt', label: 'sq ft' },
      { key: 'level2Chargers', label: 'L2 Charger' },
      { key: 'dcFastChargers', label: 'DC Fast Charger' },
      { key: 'racks', label: 'Rack' },
      { key: 'whitespaceSquareFeet', label: 'sq ft whitespace' },
      { key: 'beds', label: 'Bed' },
      { key: 'operatingRooms', label: 'OR' },
    ];
    
    for (const field of unitFields) {
      const value = facilityDetails[field.key];
      if (value && parseInt(String(value)) > 0) {
        const count = parseInt(String(value)).toLocaleString();
        const plural = parseInt(String(value)) > 1 ? 's' : '';
        return `${count}-${field.label}${plural} ${subtype || type}`;
      }
    }
    
    return subtype ? `${subtype} ${type}` : type;
  };

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════════
          NEW: YOUR FACILITY CONFIGURATION - Shows Merlin "gets it"
          ════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/30">
        <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Your Facility Configuration
        </h3>
        
        {/* Facility Type Badge */}
        <div className="mb-4 flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30">
            <span className="text-amber-200 font-bold text-lg">{getFacilityDescription()}</span>
          </div>
          {inputs.industry.subtypeName && inputs.industry.subtypeName !== inputs.industry.typeName && (
            <span className="text-slate-400 text-sm">({inputs.industry.typeName})</span>
          )}
        </div>
        
        {/* Base Load Calculation */}
        {baseLoadStep && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span className="text-amber-400">⚡</span> Base Load Calculation
              </h4>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                {baseLoadStep.output?.value?.toLocaleString()} {baseLoadStep.output?.unit}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-2">{baseLoadStep.description}</p>
            <div className="p-3 rounded-lg bg-[#0f1d33]/70">
              <p className="text-xs text-slate-500 mb-1">Formula</p>
              <p className="text-sm font-mono text-cyan-400">{baseLoadStep.formula}</p>
              <p className="text-sm font-mono text-purple-300 mt-1">{baseLoadStep.calculation}</p>
            </div>
            {/* Show inputs */}
            {baseLoadStep.inputs && baseLoadStep.inputs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {baseLoadStep.inputs.map((input, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs">
                    <span className="text-slate-400">{input.name}:</span>
                    <span className="text-white font-medium ml-1">
                      {typeof input.value === 'number' ? input.value.toLocaleString() : input.value}
                      {input.unit && ` ${input.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Modifiers / Add-ons */}
        {modifierSteps.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="text-purple-400">+</span> Additional Load Factors
            </h4>
            <div className="space-y-2">
              {modifierSteps.map((step, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5/30 border border-white/10/30">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">•</span>
                    <span className="text-slate-300 text-sm">{step.name.replace('Apply ', '')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{step.calculation}</span>
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-medium">
                      {step.output?.value?.toLocaleString()} {step.output?.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Final Peak Demand */}
        <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-amber-300 font-semibold">Total Peak Demand</span>
          <span className="text-2xl font-bold text-white">
            {results.peakDemandKW.toLocaleString()} <span className="text-amber-400 text-lg">kW</span>
          </span>
        </div>
      </div>

      {/* Deviations Section (if any) */}
      {deviations && deviations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Deviations Detected
          </h3>
          {deviations.map((dev, i) => (
            <div 
              key={i}
              className={`p-4 rounded-xl border ${
                dev.severity === 'critical' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-semibold ${dev.severity === 'critical' ? 'text-red-400' : 'text-orange-400'}`}>
                  {dev.field}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${dev.severity === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
                  {dev.deviationPercent.toFixed(1)}% deviation
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                Displayed: <span className="font-mono text-slate-300">{dev.displayed.toLocaleString()}</span>
                {' → '}
                Calculated: <span className="font-mono text-emerald-400">{dev.calculated.toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-500">{dev.explanation}</p>
              {dev.recommendation && (
                <p className="text-sm text-purple-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {dev.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Location & Facility Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Location
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">ZIP Code</span>
              <span className="text-white font-medium">{inputs.location.zipCode} ({inputs.location.state})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Electricity</span>
              <span className="text-white font-medium">${inputs.location.electricityRate.toFixed(4)}/kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Demand Charge</span>
              <span className="text-white font-medium">${inputs.location.demandChargeRate.toFixed(2)}/kW-mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sun Hours</span>
              <span className="text-white font-medium">{inputs.location.sunHours} hrs/day</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Facility Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Industry</span>
              <span className="text-white font-medium">{inputs.industry.typeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="text-white font-medium">{inputs.industry.subtypeName}</span>
            </div>
            {/* Show key facility details */}
            {Object.entries(facilityDetails).slice(0, 4).map(([key, value]) => {
              // Skip internal fields
              if (key.startsWith('_') || key === 'undefined') return null;
              // Format the key nicely
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace('Sq Ft', 'sq ft')
                .replace('K W', 'kW');
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-white font-medium">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30">
        <h4 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" />
          System Sizing Results
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ResultCard label="Peak Demand" value={`${results.peakDemandKW.toLocaleString()} kW`} />
          <ResultCard label="BESS Power" value={`${results.bessKW.toLocaleString()} kW`} />
          <ResultCard label="BESS Capacity" value={`${results.bessKWh.toLocaleString()} kWh`} />
          <ResultCard label="Solar" value={results.solarKWp ? `${results.solarKWp.toLocaleString()} kW` : '—'} />
          <ResultCard label="Generator" value={results.generatorKW ? `${results.generatorKW.toLocaleString()} kW` : '—'} />
          <ResultCard label="Net Cost" value={`$${(results.netCost / 1000).toFixed(0)}K`} highlight />
          <ResultCard label="Annual Savings" value={`$${(results.annualSavings / 1000).toFixed(0)}K`} highlight />
          <ResultCard label="Payback" value={`${results.paybackYears.toFixed(1)} yrs`} highlight />
        </div>
      </div>
    </div>
  );
};

// Result Card Component
const ResultCard: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`p-3 rounded-lg ${highlight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5'}`}>
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
  </div>
);

// Steps Tab
const StepsTab: React.FC<{ steps: CalculationStep[] }> = ({ steps }) => {
  const categories = ['power_demand', 'bess_sizing', 'solar_sizing', 'generator', 'financial'];
  const categoryNames: Record<string, string> = {
    power_demand: '⚡ Power Demand',
    bess_sizing: '🔋 BESS Sizing',
    solar_sizing: '☀️ Solar Sizing',
    generator: '🔌 Generator',
    financial: '💰 Financial'
  };

  const groupedSteps = categories.reduce((acc, cat) => {
    acc[cat] = steps.filter(s => s.category === cat);
    return acc;
  }, {} as Record<string, CalculationStep[]>);

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categorySteps = groupedSteps[category];
        if (!categorySteps || categorySteps.length === 0) return null;
        
        return (
          <div key={category}>
            <h3 className="text-lg font-bold text-white mb-3">{categoryNames[category]}</h3>
            <div className="space-y-3">
              {categorySteps.map((step, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-purple-300">{step.name}</h4>
                    <span className="text-xs text-slate-500">Step {step.stepNumber}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                  
                  <div className="p-3 rounded-lg bg-[#0f1d33]/70 mb-3">
                    <p className="text-xs text-slate-500 mb-1">Formula</p>
                    <p className="text-sm font-mono text-cyan-400">{step.formula}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-purple-400 mb-1">Calculation</p>
                    <p className="text-sm font-mono text-white">{step.calculation}</p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Output:</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {step.output.value.toLocaleString()} {step.output.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Sources Tab
const SourcesTab: React.FC<{ sources: SourceCitation[] }> = ({ sources }) => {
  // Handle empty or undefined sources array
  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No sources available for this quote.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 mb-4">
        All calculations are backed by authoritative industry sources.
      </p>
      
      {sources.map((source, i) => (
        <div key={source.id || i} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-white">{source.shortName}</h4>
              <p className="text-sm text-slate-400">{source.fullName}</p>
              {/* Organization and Year */}
              {(source.organization || source.year) && (
                <div className="flex items-center gap-2 mt-1">
                  {source.organization && (
                    <span className="text-xs text-slate-500">{source.organization}</span>
                  )}
                  {source.organization && source.year && (
                    <span className="text-xs text-slate-600">•</span>
                  )}
                  {source.year && (
                    <span className="text-xs text-slate-500">{source.year}</span>
                  )}
                </div>
              )}
            </div>
            {source.url && (
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors ml-4 flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          
          {/* Description (optional - only show if present) */}
          {source.description && (
            <p className="text-sm text-slate-500 mb-3">{source.description}</p>
          )}
          
          {/* Data Points (optional - only show if present) */}
          {source.dataPoints && source.dataPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {source.dataPoints.map((point, j) => (
                <span key={j} className="px-2 py-1 rounded-full bg-white/5 text-xs text-slate-400">
                  {point}
                </span>
              ))}
            </div>
          )}
          
          {/* Used For (new field - only show if present) */}
          {source.usedFor && source.usedFor.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-2">Used for:</p>
              <div className="flex flex-wrap gap-2">
                {source.usedFor.map((item, j) => (
                  <span key={j} className="px-2 py-1 rounded-full bg-purple-500/20 text-xs text-purple-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Financials Tab
const FinancialsTab: React.FC<{ worksheetData: TrueQuoteWorksheetData }> = ({ worksheetData }) => {
  const { results } = worksheetData;
  
  // Map worksheet data to financial inputs
  const financialInputs: FinancialInputs = useMemo(() => ({
    totalInvestment: results.totalInvestment,
    federalITC: results.federalITC,
    netInvestment: results.netCost,
    annualSavings: results.annualSavings,
    bessKWh: results.bessKWh,
    solarKW: results.solarKWp,
  }), [results]);
  
  // Calculate 10-year projection
  const projection = useMemo(() => 
    calculateFinancialProjection(financialInputs, 10),
    [financialInputs]
  );
  
  const { summaryCards, yearlyTable } = formatProjectionForDisplay(projection);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          10-Year Financial Projection
        </h3>
        <p className="text-sm text-slate-400">
          Multi-year cash flow analysis with degradation, escalation, and present value calculations
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <div 
            key={i}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30"
          >
            <p className="text-xs text-slate-400 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            {card.subtext && (
              <p className="text-xs text-slate-500">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Year-by-Year Table */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-400" />
          Year-by-Year Cash Flow
        </h4>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual Savings</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {yearlyTable.map((row, i) => (
                  <tr 
                    key={i} 
                    className={row.status.includes('Profit') 
                      ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                      : 'hover:bg-white/5/30'
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">{row.year}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{row.savings}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      row.cumulative.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {row.cumulative}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.status.includes('Profit')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Key Assumptions */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Key Assumptions
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Electricity Escalation:</span>
            <span className="text-white ml-1">3%/year</span>
          </div>
          <div>
            <span className="text-slate-500">Discount Rate:</span>
            <span className="text-white ml-1">8%</span>
          </div>
          <div>
            <span className="text-slate-500">Battery Degradation:</span>
            <span className="text-white ml-1">2%/year</span>
          </div>
          <div>
            <span className="text-slate-500">Solar Degradation:</span>
            <span className="text-white ml-1">0.5%/year</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrueQuoteVerifyBadge;
