import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  Settings, 
  Calculator,
  BarChart3,
  FileText,
  Wrench,
  Sparkles,
  ChevronRight,
  Upload,
  Crown,
  CheckCircle,
  Star
} from 'lucide-react';
import SpecUploadModal from '../upload/SpecUploadModal';
import merlinImage from '@/assets/images/new_Merlin.png';

interface AdvancedQuoteBuilderLandingProps {
  onBackToHome: () => void;
  onStartCustomQuote: () => void;
  onShowSmartWizard: () => void;
  onShowFinancialCalculator?: () => void;
  onShowMarketAnalytics?: () => void;
  onShowComponentLibrary?: () => void;
  onShowQuoteTemplates?: () => void;
  onExtractedSpecs?: (specs: {
    storageSizeMW: number;
    durationHours: number;
    location?: string;
    solarMW?: number;
    windMW?: number;
    generatorMW?: number;
    gridConnection?: 'on-grid' | 'off-grid' | 'limited';
    useCase?: string;
  }) => void;
}

const AdvancedQuoteBuilderLanding: React.FC<AdvancedQuoteBuilderLandingProps> = ({
  onBackToHome,
  onStartCustomQuote,
  onShowSmartWizard,
  onShowFinancialCalculator,
  onShowMarketAnalytics,
  onShowComponentLibrary,
  onShowQuoteTemplates,
  onExtractedSpecs
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState<string | null>(null);

  // BUG FIX: Auto-start custom quote if view=custom-config in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'custom-config' && onStartCustomQuote) {
      // Small delay to ensure component is mounted
      setTimeout(() => onStartCustomQuote(), 100);
    }
  }, [onStartCustomQuote]);

  // Primary tools that work
  const primaryTools = [
    {
      id: 'upload-specs',
      icon: <Upload className="w-10 h-10" />,
      title: 'Upload Specs',
      subtitle: 'AI-Powered Extraction',
      description: 'Upload utility bills, equipment lists, or load profiles',
      gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
      borderColor: 'border-purple-400/50',
      action: () => setShowUploadModal(true),
      features: ['PDF, Excel, Word, CSV, Images', 'AI data extraction', 'Auto-populate fields'],
      isNew: true,
      available: true
    },
    {
      id: 'custom-config',
      icon: <Settings className="w-10 h-10" />,
      title: 'System Configuration',
      subtitle: 'Full Manual Control',
      description: 'Design your complete BESS system with all parameters',
      gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      borderColor: 'border-purple-400/50',
      action: onStartCustomQuote,
      features: ['Power & energy sizing', 'Renewable integration', 'Equipment selection'],
      isNew: false,
      available: true
    },
    {
      id: 'smart-wizard',
      icon: <Sparkles className="w-10 h-10" />,
      title: 'Smart Wizard',
      subtitle: 'Guided Experience',
      description: 'Answer questions and get AI-powered recommendations',
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
      borderColor: 'border-indigo-400/50',
      action: onShowSmartWizard,
      features: ['Step-by-step guidance', 'Industry templates', 'Auto-sizing'],
      isNew: false,
      available: true
    }
  ];

  // Secondary tools (some coming soon)
  const secondaryTools = [
    {
      id: 'financial',
      icon: <Calculator className="w-8 h-8" />,
      title: 'Financial Calculator',
      description: 'ROI, NPV, payback analysis',
      gradient: 'from-green-600 to-emerald-600',
      action: onShowFinancialCalculator || (() => setShowComingSoonModal('Financial Calculator')),
      available: !!onShowFinancialCalculator
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Market Analytics',
      description: 'Industry benchmarks & trends',
      gradient: 'from-blue-600 to-cyan-600',
      action: onShowMarketAnalytics || (() => setShowComingSoonModal('Market Analytics')),
      available: !!onShowMarketAnalytics
    },
    {
      id: 'components',
      icon: <Wrench className="w-8 h-8" />,
      title: 'Component Library',
      description: 'Equipment specifications',
      gradient: 'from-slate-600 to-gray-600',
      action: onShowComponentLibrary || (() => setShowComingSoonModal('Component Library')),
      available: !!onShowComponentLibrary
    },
    {
      id: 'reports',
      icon: <FileText className="w-8 h-8" />,
      title: 'Custom Reports',
      description: 'Professional documentation',
      gradient: 'from-violet-600 to-purple-600',
      action: onShowQuoteTemplates || (() => setShowComingSoonModal('Custom Reports')),
      available: !!onShowQuoteTemplates
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header - Merlin Theme */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-purple-800 border-b-4 border-purple-400 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-1 shadow-lg">
                  <img src={merlinImage} alt="Merlin" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Advanced Quote Builder
                  </h1>
                  <p className="text-purple-200 text-sm">Professional BESS Configuration Tools</p>
                </div>
              </div>
            </div>
            <button
              onClick={onShowSmartWizard}
              className="flex items-center gap-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 hover:from-gray-200 hover:via-gray-300 hover:to-gray-200 px-5 py-2.5 rounded-xl transition-all font-bold text-purple-700 border-2 border-gray-300 hover:border-purple-400 shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              Smart Wizard Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-blue-600/20 backdrop-blur-xl border-2 border-purple-400/30 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-2xl p-3 border border-purple-400/30">
                <img src={merlinImage} alt="Merlin" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-3">Welcome to Professional Mode</h2>
              <p className="text-purple-200 text-lg mb-4 max-w-2xl">
                Access enterprise-grade tools for designing custom battery energy storage systems. 
                Upload specs, configure manually, or let AI guide you.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Full Control
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium">
                  <Sparkles className="w-4 h-4" /> AI-Powered
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm font-medium">
                  <Crown className="w-4 h-4" /> Professional
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Tools - Large Cards */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Start Your Quote
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {primaryTools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.action}
                className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border-2 ${tool.borderColor} hover:border-white/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-xl hover:shadow-2xl text-left`}
              >
                {/* NEW Badge */}
                {tool.isNew && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      NEW
                    </span>
                  </div>
                )}
                
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${tool.gradient} p-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      {tool.icon}
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-1">{tool.title}</h4>
                  <p className="text-white/80 text-sm font-medium">{tool.subtitle}</p>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-300 mb-4">{tool.description}</p>
                  <ul className="space-y-2">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Tools - Smaller Cards */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-400" />
            Additional Tools
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryTools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.action}
                className={`group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02] text-left ${!tool.available ? 'opacity-70' : ''}`}
              >
                {!tool.available && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-purple-700/50 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  </div>
                )}
                <div className={`inline-flex p-2.5 bg-gradient-to-r ${tool.gradient} rounded-lg mb-3`}>
                  {tool.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                  {tool.title}
                </h4>
                <p className="text-gray-400 text-sm">{tool.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Start Tips */}
        <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Quick Start Tips</h3>
              <ul className="text-purple-200 space-y-1 text-sm">
                <li>• <strong>Have specs?</strong> Use <span className="text-emerald-400">Upload Specs</span> for instant data extraction</li>
                <li>• <strong>Know your requirements?</strong> Go to <span className="text-purple-400">System Configuration</span> for full control</li>
                <li>• <strong>Need guidance?</strong> The <span className="text-amber-400">Smart Wizard</span> walks you through step-by-step</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Powered by <span className="text-purple-400 font-semibold">Merlin Energy</span> • AI-Optimized Battery Storage Solutions
          </p>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-purple-500/30">
            <div className="text-center">
              <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Coming Soon!</h3>
              <p className="text-gray-300 mb-6">
                <strong className="text-purple-400">{showComingSoonModal}</strong> is currently under development. 
                For now, use System Configuration or Smart Wizard to build your quote.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowComingSoonModal(null)}
                  className="flex-1 bg-purple-800/60 hover:bg-purple-700/70 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowComingSoonModal(null);
                    onStartCustomQuote();
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Start Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Specs Modal */}
      {showUploadModal && (
        <SpecUploadModal
          onClose={() => setShowUploadModal(false)}
          onExtracted={(specs) => {
            setShowUploadModal(false);
            if (onExtractedSpecs) {
              onExtractedSpecs(specs);
            } else {
              onStartCustomQuote();
            }
          }}
        />
      )}
    </div>
  );
};

export default AdvancedQuoteBuilderLanding;
