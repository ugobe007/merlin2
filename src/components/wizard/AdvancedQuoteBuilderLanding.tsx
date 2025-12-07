import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  Settings, 
  Calculator,
  TrendingUp,
  BarChart3,
  FileText,
  Wrench,
  Sparkles,
  ChevronRight,
  Upload
} from 'lucide-react';
import SpecUploadModal from '../upload/SpecUploadModal';

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
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const tools = [
    {
      id: 'upload-specs',
      icon: <Upload className="w-12 h-12" />,
      title: 'Upload Specs',
      description: 'Upload your RFP, spec sheet, or requirements document',
      color: 'from-green-600 to-teal-600',
      action: () => setShowUploadModal(true),
      features: [
        'PDF, Excel, CSV support',
        'AI-powered data extraction',
        'Automatic field population',
        'Review before quote'
      ],
      isNew: true
    },
    {
      id: 'custom-config',
      icon: <Settings className="w-12 h-12" />,
      title: 'Custom Configuration',
      description: 'Build your quote from scratch with full manual control',
      color: 'from-purple-600 to-indigo-600',
      action: onStartCustomQuote,
      features: [
        'Manual power & energy sizing',
        'Custom renewable integration',
        'Advanced financial modeling',
        'Full equipment control'
      ]
    },
    {
      id: 'optimization',
      icon: <Sparkles className="w-12 h-12" />,
      title: 'AI Optimization Engine',
      description: 'Let AI analyze and optimize your configuration',
      color: 'from-blue-600 to-cyan-600',
      action: () => {
        // Don't open Smart Wizard - user wants stable interface
        // AI optimization is available in the Interactive Dashboard
        if (window.confirm('💡 AI Optimization Engine\n\nWould you like to use the Smart Wizard with AI-powered recommendations?\n\nOK = Open Smart Wizard\nCancel = Return to Home')) {
          onShowSmartWizard();
        } else {
          onBackToHome();
        }
      },
      features: [
        'Intelligent sizing recommendations',
        'Cost-benefit analysis',
        'Performance predictions',
        'Alternative configurations'
      ]
    },
    {
      id: 'financial',
      icon: <Calculator className="w-12 h-12" />,
      title: 'Financial Calculator',
      description: 'Deep-dive financial analysis and projections',
      color: 'from-green-600 to-emerald-600',
      action: onShowFinancialCalculator || (() => setSelectedTool('financial')),
      features: [
        'ROI & payback calculations',
        'Cash flow projections',
        'Financing scenarios',
        'Tax incentive analysis'
      ]
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="w-12 h-12" />,
      title: 'Market Analytics',
      description: 'Industry benchmarks and market intelligence',
      color: 'from-orange-600 to-red-600',
      action: onShowMarketAnalytics || (() => setSelectedTool('analytics')),
      features: [
        'Industry comparisons',
        'Pricing trends',
        'Technology benchmarks',
        'Market insights'
      ]
    },
    {
      id: 'components',
      icon: <Wrench className="w-12 h-12" />,
      title: 'Component Library',
      description: 'Browse and select specific equipment',
      color: 'from-gray-600 to-slate-600',
      action: onShowComponentLibrary || (() => setSelectedTool('components')),
      features: [
        'Battery specifications',
        'Solar panel options',
        'Inverter selection',
        'BOS equipment'
      ]
    },
    {
      id: 'reports',
      icon: <FileText className="w-12 h-12" />,
      title: 'Custom Reports',
      description: 'Generate detailed technical and financial reports',
      color: 'from-indigo-600 to-purple-600',
      action: onShowQuoteTemplates || (() => setSelectedTool('reports')),
      features: [
        'Technical specifications',
        'Financial summaries',
        'Executive presentations',
        'Export to PDF/Word'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">⚡ Advanced Quote Builder</h1>
                <p className="text-orange-100 mt-1">Professional tools for power users</p>
              </div>
            </div>
            <button
              onClick={onShowSmartWizard}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-colors font-semibold"
            >
              <Sparkles className="w-5 h-5" />
              Smart Wizard Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Introduction */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-300">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Advanced Mode</h2>
              <p className="text-gray-700 mb-4">
                Access professional-grade tools for building custom energy storage quotes. 
                Choose from manual configuration, AI-powered optimization, financial analysis, 
                and more specialized tools.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Full Control</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>AI Assistance Available</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Professional Features</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden relative"
              onClick={tool.action}
            >
              {/* NEW Badge */}
              {'isNew' in tool && tool.isNew && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 animate-pulse">
                  NEW
                </div>
              )}
              {/* Tool Header */}
              <div className={`bg-gradient-to-r ${tool.color} text-white p-6`}>
                <div className="flex items-center justify-between mb-3">
                  {tool.icon}
                  <ChevronRight className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                <p className="text-white/90 text-sm">{tool.description}</p>
              </div>

              {/* Features List */}
              <div className="p-6">
                <ul className="space-y-2">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    tool.action();
                  }}
                  className={`w-full bg-gradient-to-r ${tool.color} hover:opacity-90 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2`}
                >
                  Launch Tool
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">New to Advanced Mode?</h3>
              <p className="text-gray-700 mb-3">
                Start with <strong>Custom Configuration</strong> to build your quote manually, 
                or use <strong>AI Optimization</strong> to get intelligent recommendations based on your inputs.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onStartCustomQuote}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Start Custom Quote
                </button>
                <button
                  onClick={onShowSmartWizard}
                  className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm transition-colors border border-gray-300"
                >
                  Or Use Smart Wizard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Tools */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            🚀 More tools coming soon: Template Library • Collaboration • Version Control • API Access
          </p>
        </div>
      </div>

      {/* Tool Modal (for future implementation) */}
      {selectedTool && selectedTool !== 'custom-config' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h3>
            <p className="text-gray-600 mb-6">
              The <strong>{tools.find(t => t.id === selectedTool)?.title}</strong> tool 
              is currently under development. For now, please use the Custom Configuration 
              tool to build your quote.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTool(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedTool(null);
                  onStartCustomQuote();
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Custom Quote
              </button>
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
              // Fallback: start custom quote with extracted specs
              // The parent component should handle this properly
              onStartCustomQuote();
            }
          }}
        />
      )}
    </div>
  );
};

export default AdvancedQuoteBuilderLanding;
