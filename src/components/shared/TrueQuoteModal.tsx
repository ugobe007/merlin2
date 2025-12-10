/**
 * TrueQuoteModal.tsx
 * 
 * A compelling marketing modal that explains TrueQuote™ and why it matters.
 * Designed to convert skeptics into believers with visual proof and clear messaging.
 * 
 * Features:
 * - Animated entrance
 * - Side-by-side competitor comparison
 * - Interactive 3 pillars section
 * - Authority badge showcase
 * - Strong CTA
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Search, 
  ExternalLink,
  Award,
  Sparkles,
  ArrowRight,
  Building2,
  Landmark,
  BadgeCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronRight,
  Zap
} from 'lucide-react';
import { TrueQuoteBadge, TrueQuoteSeal } from './TrueQuoteBadge';
import { AUTHORITY_SOURCES } from './IndustryComplianceBadges';

// ============================================================================
// TYPES
// ============================================================================

interface TrueQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetQuote?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TrueQuoteModal: React.FC<TrueQuoteModalProps> = ({
  isOpen,
  onClose,
  onGetQuote
}) => {
  const [activeTab, setActiveTab] = useState<'why' | 'how' | 'proof'>('why');
  const [showComparison, setShowComparison] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
      setTimeout(() => setShowComparison(true), 500);
    } else {
      setAnimateIn(false);
      setShowComparison(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl transition-all duration-500 ${
          animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header with Golden Gradient */}
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 px-8 py-10 text-center overflow-hidden">
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          
          {/* Floating badges */}
          <div className="absolute top-4 left-8 opacity-20">
            <Shield className="w-24 h-24 text-white" />
          </div>
          <div className="absolute bottom-4 right-8 opacity-20">
            <BadgeCheck className="w-20 h-20 text-white" />
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrueQuoteSeal size="lg" showDetails={false} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
              Introducing TrueQuote™
            </h1>
            <p className="text-xl text-white/90 font-medium">
              The Quote That Shows Its Work™
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'why', label: 'Why It Matters', icon: AlertTriangle },
            { id: 'how', label: 'How It Works', icon: Eye },
            { id: 'proof', label: 'See The Proof', icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-8">
          
          {/* TAB: Why It Matters */}
          {activeTab === 'why' && (
            <div className="space-y-8">
              {/* The Problem */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  The Industry's Dirty Secret
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  When you get a BESS quote from most vendors, you're trusting a black box. 
                  They give you numbers, but <strong>can't tell you where they came from</strong>. 
                  Banks know this. Investors know this. That's why projects stall.
                </p>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Competitor Quote */}
                <div className={`bg-gray-100 rounded-2xl p-6 border-2 border-gray-300 transition-all duration-700 ${showComparison ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-700">Typical Competitor Quote</h3>
                  </div>
                  
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Battery System:</span>
                      <span className="font-bold">$2,400,000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Annual Savings:</span>
                      <span className="font-bold">$450,000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Payback Period:</span>
                      <span className="font-bold">5.3 years</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-700">
                        <strong>Where do these numbers come from?</strong>
                        <p className="text-red-600 mt-1">"Trust us, we're experts."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TrueQuote */}
                <div className={`bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-300 shadow-lg transition-all duration-700 delay-200 ${showComparison ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrueQuoteBadge size="sm" showTooltip={false} />
                    <h3 className="font-bold text-amber-800">Merlin TrueQuote™</h3>
                  </div>
                  
                  <div className="space-y-3 font-mono text-sm">
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Battery System:</span>
                        <span className="font-bold">$2,400,000</span>
                      </div>
                      <div className="text-xs text-amber-700 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        NREL ATB 2024, LFP 4-hr, $150/kWh
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Annual Savings:</span>
                        <span className="font-bold">$450,000</span>
                      </div>
                      <div className="text-xs text-amber-700 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        StoreFAST methodology, EIA rates
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Payback Period:</span>
                        <span className="font-bold">5.3 years</span>
                      </div>
                      <div className="text-xs text-amber-700 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        8% discount, 2% degradation, 30% ITC
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-emerald-700">
                        <strong>Every number is verifiable.</strong>
                        <p className="text-emerald-600 mt-1">Export JSON audit trail for bank due diligence.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="text-center py-6">
                <p className="text-2xl font-bold text-gray-700 italic">
                  "Ask competitors where their numbers come from."
                </p>
              </div>
            </div>
          )}

          {/* TAB: How It Works */}
          {activeTab === 'how' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">The Three Pillars of TrueQuote™</h2>
                <p className="text-gray-600">Every Merlin quote meets these standards. No exceptions.</p>
              </div>

              {/* Three Pillars - Large Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Traceable */}
                <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Traceable</h3>
                  <p className="text-gray-600 mb-4">
                    Every number links to a specific, documented source. NREL ATB, DOE, EIA — not "our proprietary model."
                  </p>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Line-item source citations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Direct links to benchmarks
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Version-dated references
                    </li>
                  </ul>
                </div>

                {/* Auditable */}
                <div className="group bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Auditable</h3>
                  <p className="text-gray-600 mb-4">
                    Complete methodology is documented. Export JSON metadata with every assumption laid bare.
                  </p>
                  <ul className="space-y-2 text-sm text-emerald-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      JSON/Excel audit export
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      All assumptions documented
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Public methodology whitepaper
                    </li>
                  </ul>
                </div>

                {/* Verifiable */}
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BadgeCheck className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Verifiable</h3>
                  <p className="text-gray-600 mb-4">
                    Third parties can check independently. Banks don't need to call us — they can verify themselves.
                  </p>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Public benchmark references
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Deviation auto-flagging
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Formula transparency
                    </li>
                  </ul>
                </div>
              </div>

              {/* Deviation Flagging Example */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Automatic Deviation Flagging
                </h3>
                <p className="text-gray-600 mb-4">
                  When our applied price differs from the benchmark by more than 15%, TrueQuote™ automatically flags it with an explanation:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 font-mono text-sm">
                  <div className="text-amber-800">
                    <span className="text-amber-600">⚠️ DEVIATION:</span> Battery pack $/kWh
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-amber-700">
                    <div>Benchmark: <strong>$155/kWh</strong></div>
                    <div>Applied: <strong>$275/kWh</strong></div>
                  </div>
                  <div className="mt-2 text-amber-600 text-xs">
                    Reason: Commercial-scale pricing (C&I systems &lt;1 MW include higher installation costs)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: See The Proof */}
          {activeTab === 'proof' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Backed by Industry Authorities</h2>
                <p className="text-gray-600">Our methodology aligns with the sources banks and investors trust.</p>
              </div>

              {/* Authority Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AUTHORITY_SOURCES.slice(0, 8).map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group p-4 rounded-xl border-2 ${source.bgColor} ${source.color} hover:shadow-lg transition-all`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{source.logo}</div>
                      <div className="font-bold">{source.name}</div>
                      <div className="text-xs opacity-75 truncate">{source.fullName}</div>
                      <ExternalLink className="w-3 h-3 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>

              {/* Who Benefits */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <Building2 className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-bold text-gray-800 mb-2">For Businesses</h3>
                  <p className="text-sm text-gray-600">
                    Present quotes to your CFO with confidence. Every number is defensible because every number has a source.
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <Landmark className="w-8 h-8 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-gray-800 mb-2">For Banks</h3>
                  <p className="text-sm text-gray-600">
                    Due diligence teams can verify assumptions without calling us. Export audit-ready JSON with full metadata.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-bold text-gray-800 mb-2">For Developers</h3>
                  <p className="text-sm text-gray-600">
                    Close deals faster. When prospects see NREL and DOE alignment, they stop questioning your numbers.
                  </p>
                </div>
              </div>

              {/* Testimonial Placeholder */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
                <p className="text-xl font-medium italic mb-4">
                  "For the first time, we got a BESS quote where we could actually verify the numbers ourselves. That's when we signed."
                </p>
                <p className="text-purple-200">— Future Customer Testimonial</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrueQuoteBadge size="sm" showTooltip={false} />
              <span className="text-gray-600">Ready to see the difference?</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onGetQuote?.();
              }}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5" />
              Get Your TrueQuote™
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default TrueQuoteModal;
